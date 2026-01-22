import AdminSpace from './pages/AdminSpace';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import Settings from './pages/Settings';
import Spending from './pages/Spending';
import Support from './pages/Support';
import WatchParties from './pages/WatchParties';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminSpace": AdminSpace,
    "Home": Home,
    "Landing": Landing,
    "Pricing": Pricing,
    "Settings": Settings,
    "Spending": Spending,
    "Support": Support,
    "WatchParties": WatchParties,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};