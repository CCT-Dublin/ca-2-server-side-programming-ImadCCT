const form = document.getElementById('csvForm'); // Get the form element

form.addEventListener('submit', async e => { // Handle form submission
  e.preventDefault();

  const formData = new FormData(form); // Create FormData object

// send to server
  try {
    const res = await fetch('/upload-csv', {
      method: 'POST',
      body: formData
    });

    // Parse JSON response
    const data = await res.json();
    console.log("CSV upload response:", data);

    // Fix: fallback to empty array if data.invalid is undefined
    const invalidCount = (data.invalid || []).length;
    const msg = `Inserted: ${data.inserted}, Invalid: ${invalidCount}`;

    // Display message to user
    document.getElementById('message').innerText = msg;
    form.reset();
  } catch (err) {
    console.error("Upload error:", err);
    document.getElementById('message').innerText = 'Upload failed!';
  }
});
