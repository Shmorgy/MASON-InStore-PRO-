import React, { useState, useRef } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { storage, auth } from "../firebase.js";
import useClickOutside from "../hooks/useClickOutside";

export const PP = ({ currentPic, onChange }) => {
  const defaultImage = "src/images/placeholder-profile.png";
  const [image, setImage] = useState(currentPic || defaultImage);
  const [modalOpen, setModalOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  // Close modal when clicking outside
  useClickOutside(modalRef, () => setModalOpen(false), modalOpen);

  const handleUpload = async (file) => {
    if (!file || !auth.currentUser) return;
    setUploading(true);

    try {
      const storageRef = ref(
        storage,
        `profile_pics/${auth.currentUser.uid}/${file.name}`
      );
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      setImage(downloadURL);
      if (onChange) onChange(downloadURL);
      alert("Profile picture updated!");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading profile picture.");
    } finally {
      setUploading(false);
      setModalOpen(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) handleUpload(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  return (
    <>
      {/* Profile Picture */}
      <div
        style={{
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          overflow: "hidden",
          cursor: "pointer",
          border: "2px solid #ddd",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => setModalOpen(true)}
      >
        <img
          src={image}
          onError={(e) => { e.target.src = defaultImage; }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
        >
          <div
            ref={modalRef}
            style={{
              backgroundColor: "#000",
              borderRadius: "12px",
              padding: "2rem",
              position: "relative",
              width: "320px",
              textAlign: "center",
              border: dragging ? "2px dashed #fff" : "none",
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setModalOpen(false)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                border: "none",
                background: "transparent",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "red",
              }}
            >
              ×
            </button>

            {/* Modal Image */}
            <img
              src={image}
              alt="Profile"
              onError={(e) => { e.target.src = defaultImage; }}
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                objectFit: "cover",
                marginBottom: "1rem",
              }}
            />

            {/* Upload Button */}
            <label
              style={{
                display: "inline-block",
                padding: "0.5rem 1rem",
                backgroundColor: "#000",
                color: "#fff",
                borderRadius: "8px",
                cursor: uploading ? "not-allowed" : "pointer",
              }}
            >
              {uploading ? "Uploading..." : "Upload / Drag & Drop"}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                style={{ display: "none" }}
                disabled={uploading}
              />
            </label>

            {dragging && (
              <div style={{ marginTop: "1rem", fontWeight: "bold", color: "#fff" }}>
                Drop image here
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
