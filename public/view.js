async function loadRecords() {   // Fetch and display records from the server
  const container = document.getElementById('data'); // Container element for displaying records
  // Clear previous content
  try {
    const res = await fetch('/view-data'); // Fetch data from server
    if (!res.ok) throw new Error('Network response not ok'); // Check for HTTP errors
    const result = await res.json(); // Parse JSON response

    if (!result.success || !result.data.length) { // Check for success and data presence
      container.innerHTML = "No records found.";
      return;
    }

    // Generate HTML table with fetched data
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
    console.error("Fetch error:", err); // Log error to console
    container.innerText = "Failed to load records."; // Display error message to user
  }
}

loadRecords(); // Initial call to load records when the script runs
