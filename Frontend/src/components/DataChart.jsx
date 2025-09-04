import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import styles from './DataChart.module.css';

const DataChart = ({ chartData, title = "Data Visualization", type = "bar" }) => {
  if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.chartError}>
          <p>No chart data available</p>
        </div>
      </div>
    );
  }

  const formatTooltip = (value, name, props) => {
    if (name === 'value') {
      const percentage = props.payload?.percentage;
      return [
        `${value} collectors${percentage ? ` (${percentage}%)` : ''}`,
        name === 'value' ? 'Count' : name
      ];
    }
    return [value, name];
  };

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h4 className={styles.chartTitle}>{title}</h4>
      </div>
      
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="name" 
              stroke="var(--color-text-secondary)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--color-text-secondary)"
              fontSize={12}
            />
            <Tooltip 
              formatter={formatTooltip}
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text)'
              }}
            />
            <Legend />
            <Bar 
              dataKey="value" 
              name="Collectors"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill || '#3B82F6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className={styles.chartSummary}>
        <div className={styles.summaryStats}>
          {chartData.map((item, index) => (
            <div key={index} className={styles.statItem}>
              <div 
                className={styles.statIndicator} 
                style={{ backgroundColor: item.fill }}
              ></div>
              <span className={styles.statLabel}>{item.name}:</span>
              <span className={styles.statValue}>{item.value}</span>
              {item.percentage && (
                <span className={styles.statPercentage}>({item.percentage}%)</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataChart;
