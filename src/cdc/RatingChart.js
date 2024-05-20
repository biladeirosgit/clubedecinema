// src/RatingChart.js

import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import './chart.css'

const RatingChart = ({ data }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (chartInstance.current !== null) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        const labels = Object.keys(data);
        const dividedLabels = labels.map(label => label / 2);
        const values = Object.values(data);

        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dividedLabels,
                datasets: [{
                    label: 'Ratings',
                    data: values,
                    backgroundColor: 'rgba(20,24,28, 0.5)',
                    borderColor: 'rgba(20,24,28, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        return () => {
            if (chartInstance.current !== null) {
                chartInstance.current.destroy();
            }
        };
    }, [data]);

    return (
        <>
            <div className='stats'>
                <p>Rating Chart</p>
            </div>
            <div className="chart-container">
                <canvas ref={chartRef}></canvas>
            </div>
        </>
    );
}

export default RatingChart;
