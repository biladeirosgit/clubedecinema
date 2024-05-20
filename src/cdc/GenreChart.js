// src/GenreChart.js

import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import './chart.css'

const GenreChart = ({ data }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (chartInstance.current !== null) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        const labels = Object.keys(data);
        const values = Object.values(data);

        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Genres',
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
                <p>Genre Chart</p>
            </div>
            <div className="chart-container">
                <canvas ref={chartRef}></canvas>
            </div>
        </>
    );
}

export default GenreChart;
