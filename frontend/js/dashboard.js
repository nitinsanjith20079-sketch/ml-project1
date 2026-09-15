async function loadDashboard() {
    const overview = await getAnalyticsOverview();

    const data = overview || {
        totalPlayers: 42,
        churnRate: 56,
        retention1: 44,
        retention7: 18
    };

    document.getElementById('total-players').textContent = data.totalPlayers;
    document.getElementById('churn-rate').textContent = data.churnRate.toFixed(1) + '%';
    document.getElementById('retention-1').textContent = data.retention1.toFixed(1) + '%';
    document.getElementById('retention-7').textContent = data.retention7.toFixed(1) + '%';

    // Risk Chart
    new Chart(document.getElementById('riskChart'), {
        type: 'doughnut',
        data: {
            labels: ['High Risk', 'Medium Risk', 'Low Risk'],
            datasets: [{
                data: [32, 29, 39],
                backgroundColor: ['#e74c3c', '#f39c12', '#2ecc71']
            }]
        }
    });

    // Power Chart
    new Chart(document.getElementById('powerChart'), {
        type: 'bar',
        data: {
            labels: ['Super Speed', 'Force Field', 'Fire Dash', 'Ice Time', 'Lightning', 'Hero Mode'],
            datasets: [{
                label: 'Unlock Rate %',
                data: [78, 52, 34, 21, 12, 5],
                backgroundColor: '#00b8b8'
            }]
        },
        options: { scales: { y: { beginAtZero: true, max: 100 } } }
    });
}

document.addEventListener('DOMContentLoaded', loadDashboard);
