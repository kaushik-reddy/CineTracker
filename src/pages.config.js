import AdminSpace from './pages/AdminSpace';
import Home from './pages/Home';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import Settings from './pages/Settings';
import Spending from './pages/Spending';
import Support from './pages/Support';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminSpace": AdminSpace,
    "Home": Home,
    "Landing": Landing,
    "Pricing": Pricing,
    "Settings": Settings,
    "Spending": Spending,
    "Support": Support,
    "Support": Support,
    "Login": Login,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};