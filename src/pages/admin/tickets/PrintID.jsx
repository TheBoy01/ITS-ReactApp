import React, { useState, useRef } from "react";

const PrintID = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const idCardRef = useRef(null);

  // Sample data - Add photo URLs and staff codes
  const teachers = [
    {
      id: 1,
      name: "JOHN SMITH",
      subject: "Mathematics",
      department: "Science",
      staffCode: "T1001",
      photo:
        "https://auschool-my.sharepoint.com/personal/itsupport1_arabunityschool_ae/_layouts/15/download.aspx?UniqueId=95e0e11d-51e0-4ad4-9501-45d0a525d344&Translate=false&tempauth=v1.eyJzaXRlaWQiOiJlNDIxMTExOC1lOWQzLTRmOTItYTMzMi0zMzY0YzY2MjA3ZmMiLCJhcHBfZGlzcGxheW5hbWUiOiJUZWFjaGVyc0ltYWdlcyIsIm5hbWVpZCI6ImRjNTJkYTVhLTg4NzQtNGRmOS1hOTBlLTVhODY0OWY1MjljZkBlNTFhYTBkMy1lZWIyLTQ3ZTgtOWI3MS1mYTdlY2E3MGRkNzUiLCJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvYXVzY2hvb2wtbXkuc2hhcmVwb2ludC5jb21AZTUxYWEwZDMtZWViMi00N2U4LTliNzEtZmE3ZWNhNzBkZDc1IiwiZXhwIjoiMTc2NzYwMzEwMiJ9.CkAKDGVudHJhX2NsYWltcxIwQ09IWTdjb0dFQUFhRm1NMVNHZG9SM2xpU2xWTFVGSTBSRlkzUVRoaVFWRXFBQT09CjIKCmFjdG9yYXBwaWQSJDAwMDAwMDAzLTAwMDAtMDAwMC1jMDAwLTAwMDAwMDAwMDAwMAoKCgRzbmlkEgI2NBILCJiD28epjuY-EAUaCzIwLjIwLjQ0Ljk3KixZMW5INkNWRXc4bmVUcFlnRW1QaUxMSFhuKzc4K0VwbDdBWFdXTWdUbktrPTChATgBQhCh6fUMqUAA4O7vJ9h9u-hEShBoYXNoZWRwcm9vZnRva2VuegExugEbYWxsc2l0ZXMucmVhZCBhbGxmaWxlcy5yZWFkyAEB.f0305yf-_nqwOHh-5UCADUCpDBSOBnVr2vSpwZ6w6QY&ApiVersion=2.0",
    },
    {
      id: 2,
      name: "SARAH JOHNSON",
      subject: "English",
      department: "Languages",
      staffCode: "T1002",
      photo: "https://via.placeholder.com/300x400/4A5568/FFFFFF?text=SJ",
    },
    {
      id: 3,
      name: "MICHAEL BROWN",
      subject: "Physics",
      department: "Science",
      staffCode: "T1003",
      photo: "https://via.placeholder.com/300x400/4A5568/FFFFFF?text=MB",
    },
    {
      id: 4,
      name: "EMILY DAVIS",
      subject: "History",
      department: "Social Studies",
      staffCode: "T1004",
      photo: "https://via.placeholder.com/300x400/4A5568/FFFFFF?text=ED",
    },
    {
      id: 5,
      name: "DAVID WILSON",
      subject: "Chemistry",
      department: "Science",
      staffCode: "T1005",
      photo: "https://via.placeholder.com/300x400/4A5568/FFFFFF?text=DW",
    },
  ];

  const students = [
    {
      id: 1,
      name: "ALICE ANDERSON",
      grade: "10th Grade",
      section: "A",
      rollNo: "S2001",
      photo: "https://via.placeholder.com/300x400/4A5568/FFFFFF?text=AA",
    },
    {
      id: 2,
      name: "BOB BENNETT",
      grade: "10th Grade",
      section: "A",
      rollNo: "S2002",
      photo: "https://via.placeholder.com/300x400/4A5568/FFFFFF?text=BB",
    },
    {
      id: 3,
      name: "CHARLIE CLARK",
      grade: "11th Grade",
      section: "B",
      rollNo: "S2003",
      photo: "https://via.placeholder.com/300x400/4A5568/FFFFFF?text=CC",
    },
    {
      id: 4,
      name: "DIANA DAVIS",
      grade: "9th Grade",
      section: "C",
      rollNo: "S2004",
      photo: "https://via.placeholder.com/300x400/4A5568/FFFFFF?text=DD",
    },
    {
      id: 5,
      name: "ETHAN EVANS",
      grade: "12th Grade",
      section: "A",
      rollNo: "S2005",
      photo: "https://via.placeholder.com/300x400/4A5568/FFFFFF?text=EE",
    },
  ];

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleTeacherSelect = (id) => {
    setSelectedTeachers((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    );
  };

  const handleStudentSelect = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAllTeachers = () => {
    if (selectedTeachers.length === teachers.length) {
      setSelectedTeachers([]);
    } else {
      setSelectedTeachers(teachers.map((t) => t.id));
    }
  };

  const handleSelectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
  };

  const generateIDCard = async (person, type) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // ID Card dimensions (1020 x 648 pixels for high quality)
      canvas.width = 1020;
      canvas.height = 648;

      // Load logo
      const logo = new Image();
      logo.crossOrigin = "anonymous";
      logo.src =
        "https://auschool-my.sharepoint.com/personal/itsupport1_arabunityschool_ae/_layouts/15/download.aspx?UniqueId=95e0e11d-51e0-4ad4-9501-45d0a525d344&Translate=false&tempauth=v1.eyJzaXRlaWQiOiJlNDIxMTExOC1lOWQzLTRmOTItYTMzMi0zMzY0YzY2MjA3ZmMiLCJhcHBfZGlzcGxheW5hbWUiOiJUZWFjaGVyc0ltYWdlcyIsIm5hbWVpZCI6ImRjNTJkYTVhLTg4NzQtNGRmOS1hOTBlLTVhODY0OWY1MjljZkBlNTFhYTBkMy1lZWIyLTQ3ZTgtOWI3MS1mYTdlY2E3MGRkNzUiLCJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvYXVzY2hvb2wtbXkuc2hhcmVwb2ludC5jb21AZTUxYWEwZDMtZWViMi00N2U4LTliNzEtZmE3ZWNhNzBkZDc1IiwiZXhwIjoiMTc2NzYwMzEwMiJ9.CkAKDGVudHJhX2NsYWltcxIwQ09IWTdjb0dFQUFhRm1NMVNHZG9SM2xpU2xWTFVGSTBSRlkzUVRoaVFWRXFBQT09CjIKCmFjdG9yYXBwaWQSJDAwMDAwMDAzLTAwMDAtMDAwMC1jMDAwLTAwMDAwMDAwMDAwMAoKCgRzbmlkEgI2NBILCJiD28epjuY-EAUaCzIwLjIwLjQ0Ljk3KixZMW5INkNWRXc4bmVUcFlnRW1QaUxMSFhuKzc4K0VwbDdBWFdXTWdUbktrPTChATgBQhCh6fUMqUAA4O7vJ9h9u-hEShBoYXNoZWRwcm9vZnRva2VuegExugEbYWxsc2l0ZXMucmVhZCBhbGxmaWxlcy5yZWFkyAEB.f0305yf-_nqwOHh-5UCADUCpDBSOBnVr2vSpwZ6w6QY&ApiVersion=2.0";

      logo.onload = () => {
        // Load photo
        const photo = new Image();
        photo.crossOrigin = "anonymous";
        photo.src = person.photo;

        photo.onload = () => {
          // FRONT SIDE
          // White background
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Green header
          ctx.fillStyle = "#10B981";
          ctx.fillRect(0, 0, canvas.width, 170);

          // School name - left side
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 36px Arial";
          ctx.textAlign = "left";
          ctx.fillText("ARAB UNITY SCHOOL", 50, 75);

          // Logo in center
          ctx.drawImage(logo, 460, 25, 100, 100);

          // Arabic text - right side
          ctx.font = "bold 36px Arial";
          ctx.textAlign = "right";
          ctx.fillText("مدرسة الوحدة العربية", 970, 75);

          // Photo on left
          ctx.drawImage(photo, 50, 200, 300, 400);

          // Name
          ctx.fillStyle = "#000000";
          ctx.font = "bold 48px Arial";
          ctx.textAlign = "left";
          ctx.fillText(person.name, 400, 280);

          // Role
          ctx.font = "italic bold 42px Arial";
          ctx.fillText(type === "teacher" ? "TEACHER" : "STUDENT", 400, 380);

          // Code
          ctx.font = "italic 36px Arial";
          const codeLabel =
            type === "teacher" ? "STAFF CODE :" : "STUDENT ID :";
          const code = type === "teacher" ? person.staffCode : person.rollNo;
          ctx.fillText(codeLabel + "     " + code, 400, 480);

          // Green lines at bottom
          ctx.fillStyle = "#10B981";
          ctx.fillRect(0, 530, canvas.width, 8);
          ctx.fillRect(0, 560, canvas.width, 8);
          ctx.fillRect(0, 590, canvas.width, 8);

          // Convert front to image
          const frontImage = canvas.toDataURL("image/jpeg", 0.95);

          // BACK SIDE
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // White background
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Green header
          ctx.fillStyle = "#10B981";
          ctx.fillRect(0, 0, canvas.width, 170);

          // School name
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 36px Arial";
          ctx.textAlign = "left";
          ctx.fillText("ARAB UNITY SCHOOL", 50, 75);

          // Logo
          ctx.drawImage(logo, 460, 25, 100, 100);

          // Arabic text
          ctx.textAlign = "right";
          ctx.fillText("مدرسة الوحدة العربية", 970, 75);

          // Main content area - green background
          ctx.fillStyle = "#10B981";
          ctx.fillRect(0, 175, canvas.width, 345);

          // Return text
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 32px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
            "If found, please return to P.O. Box 10563 Al Mizhar 1,",
            canvas.width / 2,
            240
          );
          ctx.fillText("Dubai U.A.E", canvas.width / 2, 290);

          ctx.font = "28px Arial";
          ctx.fillText(
            "There will be a charge of AED 20 for issuing a replacement",
            canvas.width / 2,
            360
          );
          ctx.fillText(
            "card if lost or damaged. ID card is not transferable",
            canvas.width / 2,
            400
          );

          // Emergency numbers at bottom
          ctx.fillStyle = "#10B981";
          ctx.fillRect(0, 525, canvas.width, 60);
          ctx.fillRect(0, 600, canvas.width, 48);

          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 32px Arial";
          ctx.textAlign = "left";
          ctx.fillText("Police : 999", 80, 565);
          ctx.textAlign = "center";
          ctx.fillText("Fire : 997", canvas.width / 2, 565);
          ctx.textAlign = "right";
          ctx.fillText("Ambulance : 998", canvas.width - 80, 565);

          const backImage = canvas.toDataURL("image/jpeg", 0.95);

          resolve({ front: frontImage, back: backImage });
        };
      };
    });
  };

  const handlePrint = async () => {
    const selectedCount =
      activeSection === "teachers"
        ? selectedTeachers.length
        : selectedStudents.length;

    if (selectedCount === 0) {
      alert("Please select at least one person to print ID");
      return;
    }

    setIsGenerating(true);

    const selectedPeople =
      activeSection === "teachers"
        ? teachers.filter((t) => selectedTeachers.includes(t.id))
        : students.filter((s) => selectedStudents.includes(s.id));

    for (let person of selectedPeople) {
      const { front, back } = await generateIDCard(
        person,
        activeSection === "teachers" ? "teacher" : "student"
      );

      // Download front
      const linkFront = document.createElement("a");
      linkFront.download = `${person.name.replace(/\s+/g, "_")}_ID_FRONT.jpg`;
      linkFront.href = front;
      linkFront.click();

      // Small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Download back
      const linkBack = document.createElement("a");
      linkBack.download = `${person.name.replace(/\s+/g, "_")}_ID_BACK.jpg`;
      linkBack.href = back;
      linkBack.click();

      // Delay before next person
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsGenerating(false);
    alert(`Generated ${selectedCount} ID card(s) successfully!`);
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
      <div className="max-w-6xl p-6 mx-auto">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-6 py-4 text-white rounded-t-lg bg-gradient-to-r from-blue-600 to-blue-700">
            <h2 className="text-2xl font-bold">
              <i className="mr-2 fas fa-id-card"></i>
              Print ID's
            </h2>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Teachers Section */}
            <div className="mb-4 overflow-hidden border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection("teachers")}
                className="flex items-center justify-between w-full px-6 py-4 transition-colors bg-gray-50 hover:bg-gray-100"
              >
                <span className="text-lg font-semibold text-gray-700">
                  <i className="mr-2 fas fa-chalkboard-teacher"></i>
                  Teachers
                </span>
                <i
                  className={`fas fa-chevron-down transform transition-transform duration-200 ${
                    activeSection === "teachers" ? "rotate-180" : ""
                  }`}
                ></i>
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  activeSection === "teachers"
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                } overflow-hidden`}
              >
                <div className="p-6 overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left border border-gray-300">
                          <input
                            type="checkbox"
                            checked={
                              selectedTeachers.length === teachers.length
                            }
                            onChange={handleSelectAllTeachers}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </th>
                        <th className="px-4 py-2 text-left border border-gray-300">
                          Staff Code
                        </th>
                        <th className="px-4 py-2 text-left border border-gray-300">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left border border-gray-300">
                          Subject
                        </th>
                        <th className="px-4 py-2 text-left border border-gray-300">
                          Department
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map((teacher) => (
                        <tr key={teacher.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 border border-gray-300">
                            <input
                              type="checkbox"
                              checked={selectedTeachers.includes(teacher.id)}
                              onChange={() => handleTeacherSelect(teacher.id)}
                              className="w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {teacher.staffCode}
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {teacher.name}
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {teacher.subject}
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {teacher.department}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Students Section */}
            <div className="mb-6 overflow-hidden border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection("students")}
                className="flex items-center justify-between w-full px-6 py-4 transition-colors bg-gray-50 hover:bg-gray-100"
              >
                <span className="text-lg font-semibold text-gray-700">
                  <i className="mr-2 fas fa-user-graduate"></i>
                  Students
                </span>
                <i
                  className={`fas fa-chevron-down transform transition-transform duration-200 ${
                    activeSection === "students" ? "rotate-180" : ""
                  }`}
                ></i>
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  activeSection === "students"
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                } overflow-hidden`}
              >
                <div className="p-6 overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left border border-gray-300">
                          <input
                            type="checkbox"
                            checked={
                              selectedStudents.length === students.length
                            }
                            onChange={handleSelectAllStudents}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </th>
                        <th className="px-4 py-2 text-left border border-gray-300">
                          Student ID
                        </th>
                        <th className="px-4 py-2 text-left border border-gray-300">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left border border-gray-300">
                          Grade
                        </th>
                        <th className="px-4 py-2 text-left border border-gray-300">
                          Section
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 border border-gray-300">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => handleStudentSelect(student.id)}
                              className="w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {student.rollNo}
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {student.name}
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {student.grade}
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {student.section}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Print Button */}
            <div className="flex justify-end">
              <button
                onClick={handlePrint}
                disabled={
                  isGenerating ||
                  !activeSection ||
                  (activeSection === "teachers" &&
                    selectedTeachers.length === 0) ||
                  (activeSection === "students" &&
                    selectedStudents.length === 0)
                }
                className="flex items-center gap-2 px-6 py-3 font-semibold text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Generating IDs...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-download"></i>
                    <span>Download Selected IDs</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrintID;
