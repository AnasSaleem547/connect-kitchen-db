// src/components/admin/vouchers/Vouchers.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './vouchers.css';  // CSS for Checkout component


const Vouchers = () => {
  const [vouchers, setVouchers] = useState([]);

  // Fetch voucher details on component mount
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        // Replace with your actual backend API URL
        const response = await axios.get('/admin/vouchers');
        setVouchers(response.data);
      } catch (error) {
        console.error('Error fetching vouchers:', error);
      }
    };

    fetchVouchers();
  }, []);

  return (
    <div className="voucher-container">
      <h2 className="voucher-title">Voucher Details</h2>
      
      {/* Check if vouchers are available */}
      {vouchers.length > 0 ? (
        <table className="voucher-table">
          <thead>
            <tr>
              <th>Voucher Code</th>
              <th>Minimum Order Amount</th>
              <th>Discount Percentage</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((voucher) => (
              <tr key={voucher.voucher_id}>
                <td>{voucher.voucher_code}</td>
                <td>${voucher.min_order_amount}</td>
                <td>{voucher.discount_percentage}%</td>
                <td>{voucher.status}</td>
                <td>{new Date(voucher.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No vouchers available</p>
      )}
    </div>
  );
};

export default Vouchers;
