import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';  // Make sure this file exists

function Navbar() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

    const handleLogout = () => {
        localStorage.removeItem('loggedInUser');
        window.location.href = '/login';  // Redirect to login page
    };

    return (
        <nav className={styles.navbar}>
            {/* Logo */}
            <div className={styles.navbarLogo}>
                <img src="/uploads/logo.jpeg" alt="Logo" />
            </div>

            {/* Navbar buttons */}
            <div className={styles.navbarMenu}>
                <Link to="/home" className={styles.navbarButton}>Home</Link>
                <Link to="/add-recipe" className={styles.navbarButton}>Add Recipe</Link>
                <Link to="/vouchers" className={styles.navbarButton}>Vouchers</Link> {/* Updated Link */}
                
                {/* Profile dropdown */}
                <div className={styles.profileDropdown}>
                    <button className={styles.navbarButton}>Options</button>
                    <div className={styles.dropdownContent}>
                        <Link to={`/profile/${loggedInUser?.user_id}`} className={styles.dropdownItem}>View Profile</Link>
                        <Link to="/ViewCart" className={styles.dropdownItem}>View Cart</Link> {/* New Link */}
                        <Link to="/checkout" className={styles.dropdownItem}>Checkout</Link> {/* New Link */}
                        <Link to="/notifications" className={styles.dropdownItem}>Notifications</Link> {/* New Link */}

                        <button className={styles.navbarButtonLogout} onClick={handleLogout}>Logout</button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
