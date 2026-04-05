const GAS_URL = 'https://script.google.com/macros/s/AKfycbwf-ZmenOYo-w2v5eWbD0cUIIlsA4Plu7iakT_ptjjx6X--EJL8S68TwisnSbfhxA1uHQ/exec';

export async function fetchGAS(action, data = {}) {
    const params = new URLSearchParams({
        action,
        data: JSON.stringify(data)
    });
    const url = `${GAS_URL}?${params.toString()}`;

    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
}
