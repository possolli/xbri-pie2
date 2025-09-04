const API_URL = "http://localhost:8000";

export async function get() {
  const response = await fetch(`${API_URL}/products`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    throw new Error("HTTP Error: " + response.status);
  }

  const data = await response.json();
  return data;
}
