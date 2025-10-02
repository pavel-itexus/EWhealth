<template>
    <div class="mnu">
        <nav class="primary d-none d-lg-block" v-if="categories" data-controller="SpaceForNavigation">
            <div class="container-fluid">
                <a href="#" class="logo"><img src="/assets/img/logo_mini.svg" alt=""></a>
                <ul class="additional-navigation">
                    <li :data-scroll="section.name"
                        :data-slug="section.slug"
                        v-for="(section, index) in categories"
                        :key="section.id"
                        @click.prevent="setSelectedCategorySlug(section.slug)">
                        <a :href="'#' + section.slug"
                           :class="{'active-menu-link': section.slug === selectedCategorySlug}">{{ section.name }}</a>
                    </li>
                </ul>
                <div class="logo">
                </div>
                <div class="menu-bonus">
                    <slot name="bonus_amount"></slot>
                </div>
                <div class="cart" @click.prevent="showBasket">
                    <div class="sum">
                        <animated-integer :value="totalprice" mode="manual" ref="totalBasketPrice"></animated-integer>
                        $
                    </div>
                    <a href="#" @click.prevent="showBasket">Your basket</a>
                </div>
            </div>
        </nav>
        <div class="content" v-if="orderedProducts">
            <h1 class="container-fluid title">Delivery
                {{ point.slug === 'all' ? ("в " + city.aliases.split(';')[2]) : point.name_declension }} – new
                dishes</h1>
            <div class="container-fluid"
                 :class="section.slug !== 'pizza' ? 'no-pizza':''"
                 :data-anchor="section.name"
                 :data-anchor-slug="section.slug"
                 v-for="(section, index) in orderedProducts"
                 :key="section.id"
                 v-if="section.products"
                 v-scroll="handleScroll">
                <div class="products row" id="cat_pizza">
                    <product-card
                        :product="product"
                        :cart="cart"
                        :point="point"
                        :index="index"
                        :key="index"
                        v-for="(product, index) in section.products"
                        @toggleZoom="setZoomCard"
                        @animate="startTotalAnimate"
                        :totalprice="totalprice"
                        :allmods="isAllMods(product.id)"
                        @changeprice="changePriceTotal"
                        ref="productCard"
                        :homegroup="getHomeGroup(section)"
                    >
                    </product-card>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import loginComponent from "../../../../resources/assets/js/components/LoginComponent";


if (window.VK === undefined) {
    window.VK = {
        Retargeting: {
            ProductEvent: (x, y, z) => {
            }, Hit: () => {
            }, Init: (x) => {
            }
        }, Goal: (x, y) => {
        }
    }
}
import axios from 'axios'


axios.defaults.headers.common = {
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': window.csrf_token
}
import animatedInteger from './components/AnimatedInteger.vue'
import ProductCard from './components/ProductCard.vue'


export default {
    name: 'ProductsGallery',
    props: ['url', 'cart', 'totalprice', 'allmods', 'point', 'city'],
    components: {
        ProductCard,
        animatedInteger
    },
    data() {
        return {
            categories: [],
            products: [],
            isLoading: true,
            selectedCategorySlug: location.hash ? location.hash.substring(1) : 'pizza',
            scrolledCategorySlug: location.hash ? location.hash.substring(1) : 'pizza',
        }
    },
    directives: {
        scroll: {
            inserted(el, binding) {
                let f = function (evt) {
                    if (binding.value(evt, el)) {
                        window.removeEventListener('scroll', f)
                    }
                }
                window.addEventListener('scroll', f)
            }
        },
    },
    methods: {
        setSelectedCategorySlug(slug) {
            this.selectedCategorySlug = slug
            this.scrolledCategorySlug = slug
            this.doSomeMagic()
            setTimeout(function () {
                lazyload()
            }, 50)
        },
        showBasket() {
            $('.popup_bg').addClass('visible')
            $('body').addClass('fixed')
            this.$emit('showbasket')
        },
        isAllMods(id) {
            return this.allmods.includes(id)
        },
        onScroll() {
            var scrollValue = 0
            var scrollTimeout = false


            $(window).scroll(function (event) {
                clearTimeout(scrollTimeout)
                scrollTimeout = setTimeout(function () {
                    lazyload()
                }, 50)
            })
        },
        changePriceTotal($event) {
            this.$emit('changeprice', $event)
        },
        startTotalAnimate() {
            this.$emit('animate')
        },
        deactiveAllZoom() {
            this.products.map(item => {
                if (item.products) item.products.map(product => this.$set(product, 'isZoom', false))
            })
        },
        deactiveExceptionZoom(excInd = 0) {
            this.products.map(item => {
                if (item.products) {
                    item.products.map(product => {
                        if (product.id != excInd) this.$set(product, 'isZoom', false)
                    })
                }
            })
        },
        setZoomCard(product) {
            if (product.isZoom) {
                this.$set(product, 'isZoom', false)
            } else {
                this.$set(product, 'isZoom', true)
            }
            this.deactiveExceptionZoom(product.id)
        },
        /**
         * This function is used to load the menu
         * and smoothly scroll to the loaded category.
         */
        doSomeMagic() {
            $(location).attr('hash', `#${this.selectedCategorySlug}`)
            $('.content').children().hide()
            $('.content .title').show()


            this.fetchProduct(this.selectedCategorySlug)


            let self = this;


            $('.content > div').each(function (index, element) {


                /**
                 * If the visible block matches
                 * with the current slug, show the element.
                 */
                ($(element).data('anchor-slug') === self.selectedCategorySlug) ? $(element).show() : $(element).hide()
            })


            setTimeout(function () {
                //ancorscroll
                var slug = $(location).attr('hash').split('#').pop()
                if (slug != '' && $('[data-anchor-slug="' + slug + '"]').length) {
                    $.WinWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
                    var scrollPoint = 0
                    if ($.WinWidth <= 640) {
                        scrollPoint = $('.mnu').offset().top
                    } else {
                        scrollPoint = $('[data-anchor-slug="' + slug + '"]').offset().top - $('.additional-navigation').height()
                    }


                    $('body,html').animate({
                        scrollTop: scrollPoint
                    }, transition_speed)
                }
            }, 400)
        },
        isUniqueProduct(slug) {
            let isUniq = true
            this.products.forEach((product) => product.slug === slug ? isUniq = false : null)
            return isUniq
        },
        fetchCategories() {
            axios
                .get(`${this.url}-app-category`)
                .then((response) => {
                    this.categories = response.data
                    this.isLoading = false
                })
        },
        fetchProduct(slug) {
            axios
                .get(`${this.url}-app-${slug}`)
                .then((response) => {
                    this.isUniqueProduct(slug) ? this.products.push(response.data) : null
                    this.isLoading = false
                })
        },


        /**
         * The function allows you to load the menu
         * when scrolling. Desktop and mobile.
         *
         * @param evt
         * @param el
         */
        handleScroll(evt, el) {


            /**
             * Determine screen width.
             */
            $.WinWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth


            /**
             * If it's a mobile device, then
             * add padding to 400.
             */
            let offset = $.WinWidth <= 640 ? 400 : 0


            /**
             * Checking if the client has reached
             * the end of the block we need.
             */
            if (window.scrollY + offset >= $('.mnu').height()) {
                let categoryLenth = this.categories.length
                let self = this;
                let lastVisibleMenu = $('.content > div:visible').last()


                try {


                    /**
                     * Looping through an array of menu categories.
                     */
                    for (let i = 0; categoryLenth >= i; i++) {


                        /**
                         * Checking if the current slug matches
                         * with a visible menu block.
                         */
                        if (this.categories.at(i).slug === $(lastVisibleMenu).data('anchor-slug')) {


                            /**
                             * Move the pointer to the next
                             * menu category.
                             */
                            ++i


                            this.scrolledCategorySlug = this.categories.at(i).slug


                            /**
                             * Loading menu asynchronously
                             * category to which we have scrolled.
                             */
                            this.fetchProduct(this.scrolledCategorySlug)

                            $('.content > div').each(function (index, element) {


                                /**
                                 * If the visible block matches
                                 * with the current slug, show the element.
                                 */
                                if ($(element).data('anchor-slug') === self.scrolledCategorySlug) {
                                    $(element).show()
                                }
                            })
                        }
                    }
                } catch (e) {


                }
            }
        },
        getHomeGroup(group) {
            return {'name': group.name, 'slug': group.slug};
        }
    },
    computed: {
        orderedProducts() {
            return _.orderBy(this.products, 'order', 'desc')
        }
    },
    created() {
        this.fetchCategories()
        this.fetchProduct(this.selectedCategorySlug)
        this.deactiveAllZoom()
        this.onScroll()
    },
    mounted() {
        this.$root.$on('setCategorySlug', (slug) => {
            window.scrollTo({top: 0, behavior: 'smooth'})
            this.setSelectedCategorySlug(slug)
            window.scrollTo({top: 0, behavior: 'smooth'})
        })
    }
}
</script>
<style>
.hidden {
    display: none !important;
}


@media (max-width: 991px) {
    body.sticky-nav .swiper {
        margin-bottom: 0px;
    }
}


.active-menu-link {
    text-decoration: none;
    color: #FD9A27 !important;
}

.mobile-menu-block-new {
    display: block;
    margin-top: 59px;
    height: 59px;
    max-width: 100%;
}

@media (max-width: 799px) {
    .mobile-menu-block-new {
        margin-top: 48px;
    }
}

.menu-scroll {
    overflow-x: scroll;
    overflow-y: hidden;
    white-space: nowrap;
    scrollbar-width: none;
}

.menu-scroll-mobile {
    padding-left: 0px;
    padding-right: 0px;
}

.black {
    color: black;
}

.black:hover {
    color: black;

}

.td-non {
    text-decoration: none !important;
}

.menu-scroll::-webkit-scrollbar {
    width: 0;
}

.menu-scroll-li {
    display: inline-block !important;
    margin-left: 10px !important;
    margin-top: 10px;
    padding: 10px;
}


.menu-scroll-li img {
    border-radius: 8px;
}


.menu-bonus {
    margin-right: 0px;
    margin-left: 17px;
}
</style>



