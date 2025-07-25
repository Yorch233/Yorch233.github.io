import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
    routes:[
        {
            name:"Home",
            path:"/",
            component:()=>import("../views/Profile.vue"),
            meta: { title: 'Qing Yao - Jiangsu University' }
        },
        // {
        //     name:"misb",
        //     path:"/misb",
        //     component:()=>import("../views/MISB.vue"),
        //     meta: { title: 'Generative Speech Enhancement using Mean-Inverting Schrödinger Bridge - Qing Yao - Jiangsu University' }
        // }
    ],
    history:createWebHistory()
})

export default router