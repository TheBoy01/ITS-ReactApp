import { useEffect, useState } from "react";
import api from "../../../API/api";

const Inventory = () => {
  const [imageUrls, setImageUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    try {
      const response = await api.get("api/Ticket/GetImages");
      setImageUrls(response.data.imageUrls);
    } catch (error) {
      console.error("Error fetching images:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        Loading images...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "red" }}>
        Error loading images: {error}
      </div>
    );
  }

  if (imageUrls.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        No images found.
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Teacher Images</h2>
      <table
        style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0" }}>
            <th
              style={{
                padding: "12px",
                border: "1px solid #ddd",
                textAlign: "left",
              }}
            >
              #
            </th>
            <th
              style={{
                padding: "12px",
                border: "1px solid #ddd",
                textAlign: "left",
              }}
            >
              File Name
            </th>
            <th
              style={{
                padding: "12px",
                border: "1px solid #ddd",
                textAlign: "left",
              }}
            >
              Preview
            </th>
            <th
              style={{
                padding: "12px",
                border: "1px solid #ddd",
                textAlign: "left",
              }}
            >
              URL
            </th>
          </tr>
        </thead>
        <tbody>
          {imageUrls.map((item, index) => (
            <tr
              key={index}
              style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9" }}
            >
              <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                {index + 1}
              </td>
              <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                {item.fileName}
              </td>
              <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                <img
                  src={item.imgURL}
                  alt={item.fileName}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/80?text=Error";
                  }}
                />
              </td>
              <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                <a
                  href={item.imgURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#007bff", textDecoration: "none" }}
                >
                  View Image
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Inventory;
