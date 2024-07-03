import {createRouter, createWebHistory} from "vue-router";

const router = createRouter({
    routes:[
        {
            name:"home",
            path:"/",
            component:()=>import("../views/MIDSB.vue"),
            meta: { title: 'Home Page' }
        },
        {
            name:"MIDSB",
            path:"/MIDSB",
            component:()=>import("../views/MIDSB.vue"),
            meta: { title: 'Generative Speech Enhancement using Mean-Inverting Diffusion Schrödinger Bridge' }
        }
    ],
    history:createWebHistory()
})

export default router