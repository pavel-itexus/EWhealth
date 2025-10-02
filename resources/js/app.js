import './bootstrap';

import Vue from 'vue'
import ProductsGallery from './ProductsGallery.vue'
import Basket from './components/Basket.vue'
import BasketOrder from './components/BasketOrder.vue'


new Vue({
    el: '#app',
    components: {
        ProductsGallery,
        Basket,
        BasketOrder
    },
    data: {
        isBasketVisible: false,
        orders: null
    },
    methods: {
        showBasket() {
            this.isBasketVisible = true
        },
        closeBasket() {
            this.isBasketVisible = false
        }
    },
    template: `
    <div>
      <products-gallery @add-to-basket="showBasket"/>
      <basket v-if="isBasketVisible" @close="closeBasket"/>
      <basket-order :orders="orders"/>
    </div>
  `
})
