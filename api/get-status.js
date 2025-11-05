async function getStatus(formData) {
    try {
        await fetch('./api/get-status', {
            method: 'POST',
            body: formData
        });
    } catch (e) {
        // hata olsa bile devam et
    }
    return 'ok';
}

// Kullanımı:
getStatus(formData).then(result => console.log(result)); // "ok"
