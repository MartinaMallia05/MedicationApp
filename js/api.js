// EndlessMedical API API Example
const response = await fetch('https://endlessmedical.com/sandbox/', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
});

const data = await response.json();
console.log(data);