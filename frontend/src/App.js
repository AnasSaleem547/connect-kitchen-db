import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { UserProvider, useUser } from './components/UserContext'; // Import UserProvider and useUser hook
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import LoginForm from './components/LoginForm';
import UserForm from './components/UserForm';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import EditProfile from './components/EditProfile';
import AddRecipe from './components/AddRecipe';
import Home from './components/Home';
import CreatorProfile from './components/creator-profile';
import RecipePage from './components/RecipePage';
import ViewCart from './components/ViewCart'; // Import the new ViewCart component
import Checkout from './components/Checkout'; // Assuming you have a Checkout component
import Notifications from './components/notifications'; // Import your Notifications component
import AdminLogin from './components/Admin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard';
import OrderHistory from './components/Admin/OrderHistory';
import UserProfiles from './components/Admin/UserProfiles';
import VoucherCreation from './components/Admin/VoucherCreation';
import SalesAnalytics from './components/Admin/SalesAnalytics';
import ViewComments from './components/Admin/ViewComments';  // Importing the ViewComments component
import UpdateCategory from './components/Admin/UpdateCategory';  // Importing the UpdateCategory component
import Chatbot from './components/Chatbot'; 
import Vouchers from './components/Admin/vouchers';  // Import the Vouchers component
function App() {
    return (
        <UserProvider> {/* Wrap your application with UserProvider */}
            <Router>
                <RoutesWithNavbar />
                <Chatbot/>
            </Router>
        </UserProvider>
    );
}

function RoutesWithNavbar() {
    const location = useLocation(); // Use the hook inside the Router
    const { loggedInUser } = useUser(); // Access loggedInUser from UserContext

    // List of paths where Navbar should NOT be displayed
    const noNavbarPaths = ['/', '/login', '/signup', '/admin'];

    return (
        <div>
            {/* Conditionally render Navbar based on the current location */}
            {!noNavbarPaths.includes(location.pathname) && <Navbar />}

            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/signup" element={<UserForm />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile/:user_id" element={<Profile />} />
                <Route path="/edit-profile/:user_id" element={<EditProfile />} />
                <Route path="/add-recipe" element={<AddRecipe />} />
                <Route path="/home" element={<Home />} />
                <Route path="/creator-profile/:recipe_id" element={<CreatorProfile />} />
                <Route path="/recipe/:recipeId" element={<RecipePage />} />
                <Route path="/viewcart" element={<ViewCart loggedInUser={loggedInUser} />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/AdminLogin" element={<AdminLogin />} /> {/* Admin Login Route */}
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/order-history" element={<OrderHistory />} />
                <Route path="/user-profiles" element={<UserProfiles />} />
                <Route path="/voucher-creation" element={<VoucherCreation />} />
                <Route path="/sales-analytics" element={<SalesAnalytics />} />
                {/* Define routes for the new components */}
                <Route path="view-comments" element={<ViewComments />} />
                <Route path="update-category" element={<UpdateCategory />} />
                <Route path="/vouchers" element={<Vouchers />} /> // Add the Vouchers route

            </Routes>
            
        </div>
    );
}

export default App;
