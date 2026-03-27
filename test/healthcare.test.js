const Healthcare = artifacts.require("Healthcare");

contract("Healthcare", (accounts) => {
  const [admin, doctor1, doctor2, patient1, patient2] = accounts;

  let healthcareContract;

  beforeEach(async () => {
    healthcareContract = await Healthcare.new();
  });

  // =============================
  // PATIENT REGISTRATION TESTS
  // =============================

  describe("Patient Registration", () => {
    it("should allow a patient to register", async () => {
      await healthcareContract.registerPatient("John Doe", 30, "Male", {
        from: patient1,
      });

      const patient = await healthcareContract.patients(patient1);
      assert.equal(patient.name, "John Doe", "Patient name mismatch");
      assert.equal(patient.age, 30, "Patient age mismatch");
      assert.equal(patient.gender, "Male", "Patient gender mismatch");
      assert.equal(patient.exists, true, "Patient should exist");
    });

    it("should prevent duplicate patient registration", async () => {
      await healthcareContract.registerPatient("Jane Doe", 28, "Female", {
        from: patient1,
      });

      try {
        await healthcareContract.registerPatient("Jane Doe2", 29, "Female", {
          from: patient1,
        });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Already registered"));
      }
    });
  });

  // =============================
  // DOCTOR REGISTRATION TESTS
  // =============================

  describe("Doctor Registration", () => {
    it("should allow a doctor to register", async () => {
      await healthcareContract.registerDoctor("Dr. Smith", "Cardiology", "LIC123456", {
        from: doctor1,
      });

      const doctor = await healthcareContract.doctors(doctor1);
      assert.equal(doctor.name, "Dr. Smith", "Doctor name mismatch");
      assert.equal(doctor.specialization, "Cardiology", "Specialization mismatch");
      assert.equal(doctor.license, "LIC123456", "License mismatch");
      assert.equal(doctor.isVerified, false, "Doctor should not be verified initially");
      assert.equal(doctor.exists, true, "Doctor should exist");
    });

    it("should prevent duplicate doctor registration", async () => {
      await healthcareContract.registerDoctor("Dr. Jones", "Neurology", "LIC789012", {
        from: doctor1,
      });

      try {
        await healthcareContract.registerDoctor("Dr. Jones2", "Psychiatry", "LIC345678", {
          from: doctor1,
        });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Already registered"));
      }
    });

    it("should add doctor to doctor list", async () => {
      await healthcareContract.registerDoctor("Dr. Brown", "Pediatrics", "LIC456789", {
        from: doctor1,
      });

      const doctorCount = await healthcareContract.getDoctorCount();
      assert.equal(doctorCount, 1, "Doctor count should be 1");

      const doctorList = await healthcareContract.getDoctors();
      assert.equal(doctorList[0], doctor1, "Doctor should be in list");
    });
  });

  // =============================
  // DOCTOR VERIFICATION TESTS
  // =============================

  describe("Doctor Verification", () => {
    beforeEach(async () => {
      await healthcareContract.registerDoctor("Dr. Wilson", "Orthopedics", "LIC111111", {
        from: doctor1,
      });
    });

    it("should allow admin to verify doctor", async () => {
      await healthcareContract.verifyDoctor(doctor1, { from: admin });
      const doctor = await healthcareContract.doctors(doctor1);
      assert.equal(doctor.isVerified, true, "Doctor should be verified");
    });

    it("should prevent non-admin from verifying doctor", async () => {
      try {
        await healthcareContract.verifyDoctor(doctor1, { from: patient1 });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Only admin"));
      }
    });

    it("should not verify non-existent doctor", async () => {
      try {
        await healthcareContract.verifyDoctor(doctor2, { from: admin });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Doctor not found"));
      }
    });
  });

  // =============================
  // APPOINTMENT TESTS
  // =============================

  describe("Appointments", () => {
    beforeEach(async () => {
      // Register and verify doctor
      await healthcareContract.registerDoctor("Dr. Harris", "Dermatology", "LIC222222", {
        from: doctor1,
      });
      await healthcareContract.verifyDoctor(doctor1, { from: admin });

      // Register patient
      await healthcareContract.registerPatient("Alice", 25, "Female", {
        from: patient1,
      });
    });

    it("should allow patient to request appointment", async () => {
      await healthcareContract.requestAppointment(doctor1, "Skin allergy", {
        from: patient1,
      });

      const appointment = await healthcareContract.appointments(0);
      assert.equal(appointment.patient, patient1, "Patient mismatch");
      assert.equal(appointment.doctor, doctor1, "Doctor mismatch");
      assert.equal(appointment.healthIssue, "Skin allergy", "Health issue mismatch");
      assert.equal(appointment.approved, false, "Appointment should not be approved initially");
      assert.equal(appointment.paid, false, "Appointment should not be paid initially");
    });

    it("should prevent unregistered patient from requesting appointment", async () => {
      try {
        await healthcareContract.requestAppointment(doctor1, "Back pain", {
          from: patient2,
        });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Register as patient first"));
      }
    });

    it("should prevent requesting appointment with unverified doctor", async () => {
      await healthcareContract.registerDoctor("Dr. Clark", "Gastroenterology", "LIC333333", {
        from: doctor2,
      });

      try {
        await healthcareContract.requestAppointment(doctor2, "Stomach pain", {
          from: patient1,
        });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Doctor not verified"));
      }
    });

    it("should allow doctor to approve appointment", async () => {
      await healthcareContract.requestAppointment(doctor1, "Rash", {
        from: patient1,
      });

      await healthcareContract.approveAppointment(0, "https://meet.example.com/123", {
        from: doctor1,
      });

      const appointment = await healthcareContract.appointments(0);
      assert.equal(appointment.approved, true, "Appointment should be approved");
      assert.equal(
        appointment.meetingLink,
        "https://meet.example.com/123",
        "Meeting link mismatch"
      );
    });

    it("should prevent non-doctor from approving appointment", async () => {
      await healthcareContract.requestAppointment(doctor1, "Itching", {
        from: patient1,
      });

      let errorThrown = false;
      try {
        await healthcareContract.approveAppointment(0, "https://meet.example.com/456", {
          from: patient1,
        });
      } catch (error) {
        errorThrown = true;
        assert(error.message.includes("Not your appointment") || error.message.includes("revert"));
      }
      assert(errorThrown, "Should have thrown an error");
    });
  });

  // =============================
  // PAYMENT TESTS
  // =============================

  describe("Payment System", () => {
    beforeEach(async () => {
      // Register and verify doctor
      await healthcareContract.registerDoctor("Dr. Martinez", "Internal Medicine", "LIC444444", {
        from: doctor1,
      });
      await healthcareContract.verifyDoctor(doctor1, { from: admin });

      // Register patient
      await healthcareContract.registerPatient("Bob", 40, "Male", {
        from: patient1,
      });

      // Request and approve appointment
      await healthcareContract.requestAppointment(doctor1, "Fever", {
        from: patient1,
      });
      await healthcareContract.approveAppointment(0, "https://meet.example.com/789", {
        from: doctor1,
      });
    });

    it("should allow patient to pay consultation", async () => {
      const appointment = await healthcareContract.appointments(0);
      const consultationFee = appointment.consultationFee;

      await healthcareContract.payConsultation(0, {
        from: patient1,
        value: consultationFee,
      });

      const updatedAppointment = await healthcareContract.appointments(0);
      assert.equal(updatedAppointment.paid, true, "Appointment should be marked as paid");
    });

    it("should prevent payment with incorrect amount", async () => {
      const appointment = await healthcareContract.appointments(0);
      const wrongAmount = "1000000000000000"; // intentionally wrong amount

      let errorThrown = false;
      try {
        await healthcareContract.payConsultation(0, {
          from: patient1,
          value: wrongAmount,
        });
      } catch (error) {
        errorThrown = true;
        assert(error.message.includes("Incorrect amount") || error.message.includes("revert"));
      }
      assert(errorThrown, "Should have thrown an error");
    });

    it("should prevent double payment", async () => {
      const appointment = await healthcareContract.appointments(0);
      const consultationFee = appointment.consultationFee;

      await healthcareContract.payConsultation(0, {
        from: patient1,
        value: consultationFee,
      });

      try {
        await healthcareContract.payConsultation(0, {
          from: patient1,
          value: consultationFee,
        });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Already paid"));
      }
    });
  });

  // =============================
  // RATING TESTS
  // =============================

  describe("Rating System", () => {
    beforeEach(async () => {
      // Register and verify doctor
      await healthcareContract.registerDoctor("Dr. Taylor", "Oncology", "LIC555555", {
        from: doctor1,
      });
      await healthcareContract.verifyDoctor(doctor1, { from: admin });

      // Register patient
      await healthcareContract.registerPatient("Charlie", 35, "Male", {
        from: patient1,
      });

      // Create and complete appointment
      await healthcareContract.requestAppointment(doctor1, "Cancer screening", {
        from: patient1,
      });
      await healthcareContract.approveAppointment(0, "https://meet.example.com/101112", {
        from: doctor1,
      });

      const appointment = await healthcareContract.appointments(0);
      await healthcareContract.payConsultation(0, {
        from: patient1,
        value: appointment.consultationFee,
      });

      await healthcareContract.completeAppointment(0, { from: doctor1 });
    });

    it("should allow patient to rate doctor", async () => {
      await healthcareContract.rateDoctor(0, 5, { from: patient1 });

      const appointment = await healthcareContract.appointments(0);
      assert.equal(appointment.rated, true, "Appointment should be marked as rated");

      const doctor = await healthcareContract.doctors(doctor1);
      assert(doctor.totalRatings.toNumber() > 0, "Doctor should have ratings");
    });

    it("should prevent invalid rating", async () => {
      try {
        await healthcareContract.rateDoctor(0, 10, { from: patient1 });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Invalid rating"));
      }
    });

    it("should prevent duplicate rating", async () => {
      await healthcareContract.rateDoctor(0, 4, { from: patient1 });

      try {
        await healthcareContract.rateDoctor(0, 5, { from: patient1 });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Already rated"));
      }
    });
  });
});
