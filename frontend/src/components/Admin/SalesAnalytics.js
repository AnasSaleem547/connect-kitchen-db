import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import './SalesAnalytics.css';
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const SalesAnalytics = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const response = await axios.get('/admin/sales-analytics');
        setSalesData(response.data.salesData);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch sales analytics data');
        setLoading(false);
      }
    };

    fetchSalesData();

    const interval = setInterval(fetchSalesData, 60000); // Update every minute for real-time updates

    return () => clearInterval(interval); // Cleanup the interval on component unmount
  }, []);

  // Prepare chart data
  const chartData = {
    labels: salesData.map(item => item.category_name),
    datasets: [
      {
        label: 'Total Revenue by Category',
        data: salesData.map(item => item.total_revenue),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Number of Orders by Category',
        data: salesData.map(item => item.num_orders),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Y-Axis configuration with formatting
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            // Format the revenue data as currency (for total_revenue) or add commas for number of orders
            if (this.getLabelForValue(value) === salesData[0]?.total_revenue) {
              return `$${value.toLocaleString()}`; // Adding dollar sign and formatting for total revenue
            }
            return value.toLocaleString(); // Format the order numbers with commas
          },
        },
        title: {
          display: true,
          text: 'Revenue / Orders', // Y-axis label
          font: {
            size: 16,
            weight: 'bold',
          },
          color: '#333',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 20,
          padding: 20,
        },
      },
    },
  };

  return (
    <div className="sales-analytics-container">
      <h2>Sales Analytics</h2>

      {loading && <p>Loading data...</p>}
      {error && <p className="error">{error}</p>}
      {salesData.length === 0 && !loading && <p className="no-data">No sales data available</p>}

      {salesData.length > 0 && (
        <div className="chart-container">
          <Bar data={chartData} options={options} />
        </div>
      )}
    </div>
  );
};

export default SalesAnalytics;
