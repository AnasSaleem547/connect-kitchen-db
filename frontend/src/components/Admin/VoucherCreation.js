import React, { useState } from 'react';
import axios from 'axios';
import './VoucherCreation.css';  // CSS for Checkout component



const VoucherCreation = () => {
  const [voucherForm, setVoucherForm] = useState({
    minOrderAmount: '',
    discountPercentage: '',
    voucherCount: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setVoucherForm({ ...voucherForm, [name]: value });
  };

  // Handle voucher creation
  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    const { minOrderAmount, discountPercentage, voucherCount } = voucherForm;

    if (!minOrderAmount || !discountPercentage || !voucherCount) {
      setErrorMessage('All fields are required');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await axios.post(
        '/admin/create-voucher',
        { minOrderAmount, discountPercentage, voucherCount },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccessMessage('Voucher created successfully');
      setErrorMessage('');
      setVoucherForm({ minOrderAmount: '', discountPercentage: '', voucherCount: '' }); // Reset form
    } catch (err) {
      console.error('Error creating voucher:', err);
      setErrorMessage('Error creating voucher. Please try again.');
      setSuccessMessage('');
    }
  };

  return (
    <div className="voucher-creation">
      <h2>Create Voucher</h2>

      {successMessage && <p className="success-message">{successMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <form onSubmit={handleCreateVoucher}>
        <div>
          <label>Minimum Order Amount</label>
          <input
            type="number"
            name="minOrderAmount"
            value={voucherForm.minOrderAmount}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Discount Percentage</label>
          <input
            type="number"
            name="discountPercentage"
            value={voucherForm.discountPercentage}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Voucher Count</label>
          <input
            type="number"
            name="voucherCount"
            value={voucherForm.voucherCount}
            onChange={handleChange}
          />
        </div>

        <button type="submit">Create Voucher</button>
      </form>
    </div>
  );
};

export default VoucherCreation;
