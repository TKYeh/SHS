export function formatTime(timeString) {
    if (typeof timeString !== 'string') return '';
    if (timeString.includes('T')) {
        const time = new Date(timeString);
        return time.toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
    return timeString;
}

export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
}
