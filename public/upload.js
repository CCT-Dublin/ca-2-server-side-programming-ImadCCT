const form = document.getElementById('csvForm');

form.addEventListener('submit', async e => {
  e.preventDefault();

  const formData = new FormData(form);

  try {
    const res = await fetch('/upload-csv', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    console.log("CSV upload response:", data);

    // Fix: fallback to empty array if data.invalid is undefined
    const invalidCount = (data.invalid || []).length;
    const msg = `Inserted: ${data.inserted}, Invalid: ${invalidCount}`;

    document.getElementById('message').innerText = msg;
    form.reset();
  } catch (err) {
    console.error("Upload error:", err);
    document.getElementById('message').innerText = 'Upload failed!';
  }
});
