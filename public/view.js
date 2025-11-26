async function loadRecords() {
  const container = document.getElementById('data');
  try {
    const res = await fetch('/view-data');
    if (!res.ok) throw new Error('Network response not ok');
    const result = await res.json();

    if (!result.success || !result.data.length) {
      container.innerHTML = "No records found.";
      return;
    }

    let output = "<table border='1'><tr><th>First Name</th><th>Second Name</th><th>Email</th><th>Phone</th><th>Eircode</th></tr>";
    result.data.forEach(r => {
      output += `<tr>
        <td>${r.first_name}</td>
        <td>${r.second_name}</td>
        <td>${r.email}</td>
        <td>${r.phone_number}</td>
        <td>${r.eircode}</td>
      </tr>`;
    });
    output += "</table>";
    container.innerHTML = output;
  } catch (err) {
    console.error("Fetch error:", err);
    container.innerText = "Failed to load records.";
  }
}

loadRecords();
