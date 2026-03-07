const url = "https://sksytdgylhffedofbdfj.supabase.co/rest/v1/inventory?select=*";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrc3l0ZGd5bGhmZmVkb2ZiZGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NjU0MzAsImV4cCI6MjA1NjI0MTQzMH0.sw5D-SkGd6dyw_9rULN-gETV800-4bJ3D3tIun6N7H0";

fetch(url, {
    headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`
    }
})
    .then(r => r.json())
    .then(data => {
        console.log("Inventario devuelto por Supabase: " + data.length + " filas.");
        console.log(data.slice(0, 2));
    })
    .catch(console.error);
