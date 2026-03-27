
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessNFT.sol";

contract Healthcare {
    AccessNFT public accessNFT;
    address public admin;

    // =========================
    // EMERGENCY ACCESS
    // =========================
    struct EmergencyAccessLog {
        address patient;
        address doctor;
        uint256 timestamp;
    }

    EmergencyAccessLog[] public emergencyLogs;

    event EmergencyAccess(address indexed patient, address indexed doctor, uint256 timestamp);

    function triggerEmergencyAccess(address patient) external onlyVerifiedDoctor {
        require(patients[patient].exists, "Patient not found");
        emergencyLogs.push(EmergencyAccessLog({
            patient: patient,
            doctor: msg.sender,
            timestamp: block.timestamp
        }));
        emit EmergencyAccess(patient, msg.sender, block.timestamp);
    }

    function getEmergencyLogCount() external view returns (uint256) {
        return emergencyLogs.length;
    }

    function getEmergencyLog(uint256 idx) external view returns (address, address, uint256) {
        EmergencyAccessLog storage log = emergencyLogs[idx];
        return (log.patient, log.doctor, log.timestamp);
    }

    constructor(address _accessNFT) {
        admin = msg.sender;
        accessNFT = AccessNFT(_accessNFT);
    }
    function getRole(address user) public view returns (string memory) {

        if (user == admin) {
            return "admin";
        }

        if (patients[user].exists) {
            return "patient";
        }

        if (doctors[user].exists) {
            return "doctor";
        }

        return "unregistered";
    }
    // =========================
    // ACCESS MODIFIERS
    // =========================

    modifier hasPatientConsent(address patient) {
        require(
            accessNFT.hasValidAccess(patient, msg.sender),
            "No valid consent NFT"
        );
        _;
    }

    // =========================
    // STRUCTS
    // =========================

    struct Patient {
        string name;
        uint age;
        string gender;
        bool exists;
    }

    struct Doctor {
        string name;
        string specialization;
        string license;       // medical license ID
        uint rating;          // average rating (1-5)
        uint totalRatings;
        bool isVerified;
        bool exists;
    }

    struct Appointment {
        uint id;
        address patient;
        address doctor;
        string healthIssue;
        uint consultationFee;
        bool approved;
        bool rejected;
        string meetingLink;
        bool paid;
        uint treatmentFee;
        bool treatmentPaid;
        bool completed;
        bool rated;
        string prescriptionHash;
    }

    struct MedicalRecord {
        uint id;
        address patient;
        address doctor;
        uint256 appointmentId;
        string diagnosis;
        string prescriptionText;
        string reportHash; // IPFS hash for attached report (scan, lab report, etc.)
        uint256 createdAt;
    }

    // =========================
    // STORAGE
    // =========================

    mapping(address => Patient) public patients;
    mapping(address => Doctor) public doctors;

    address[] public doctorList;
    address[] public patientList;

    Appointment[] public appointments;

    // patient => list of medical records
    mapping(address => MedicalRecord[]) private medicalRecordsByPatient;

    mapping(address => uint) public doctorEarnings;

    // =========================
    // EVENTS
    // =========================

    event PatientRegistered(address indexed patient, string name);
    event DoctorRegistered(address indexed doctor, string name, string specialization, string license);
    event DoctorVerified(address indexed doctor);

    event AppointmentRequested(uint indexed id, address indexed patient, address indexed doctor, string healthIssue, uint consultationFee);
    event AppointmentApproved(uint indexed id, address indexed doctor, string meetingLink);
    event AppointmentRejected(uint indexed id, address indexed doctor);
    event ConsultationPaid(uint indexed id, address indexed patient, address indexed doctor, uint amount);
    event TreatmentFeeSet(uint indexed id, address indexed doctor, uint treatmentFee);
    event TreatmentPaid(uint indexed id, address indexed patient, address indexed doctor, uint amount);
    event AppointmentCompleted(uint indexed id, address indexed doctor);
    event DoctorRated(uint indexed id, address indexed patient, address indexed doctor, uint rating);
    event PrescriptionAdded(uint indexed id, address indexed doctor, string prescriptionHash);
    event MedicalRecordAdded(
        address indexed patient,
        address indexed doctor,
        uint256 indexed recordId,
        uint256 appointmentId,
        string diagnosis,
        string prescriptionText,
        string reportHash
    );

    // =========================
    // MODIFIERS
    // =========================

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyVerifiedDoctor() {
        require(doctors[msg.sender].isVerified, "Doctor not verified");
        _;
    }

    // =========================
    // PATIENT FUNCTIONS
    // =========================

    function registerPatient(
        string memory _name,
        uint _age,
        string memory _gender
    ) external {
        require(!patients[msg.sender].exists, "Already registered");

        patients[msg.sender] = Patient({
            name: _name,
            age: _age,
            gender: _gender,
            exists: true
        });

        patientList.push(msg.sender);

        emit PatientRegistered(msg.sender, _name);
    }

    // =========================
    // DOCTOR FUNCTIONS
    // =========================

    function registerDoctor(
        string memory _name,
        string memory _specialization,
        string memory _license
    ) external {
        require(!doctors[msg.sender].exists, "Already registered");

        doctors[msg.sender] = Doctor({
            name: _name,
            specialization: _specialization,
            license: _license,
            rating: 5,
            totalRatings: 0,
            isVerified: false,
            exists: true
        });

        doctorList.push(msg.sender);

        emit DoctorRegistered(msg.sender, _name, _specialization, _license);
    }

    function verifyDoctor(address _doctor) external onlyAdmin {
        require(doctors[_doctor].exists, "Doctor not found");
        doctors[_doctor].isVerified = true;
        emit DoctorVerified(_doctor);
    }

    function getDoctors() external view returns (address[] memory) {
        return doctorList;
    }

    function getDoctorCount() external view returns (uint) {
        return doctorList.length;
    }

    function getPatientCount() external view returns (uint) {
        return patientList.length;
    }

    function getDoctorDetails(address _doctor)
        external
        view
        returns (
            string memory name,
            string memory specialization,
            string memory license,
            uint rating,
            uint totalRatings,
            bool isVerified,
            bool exists
        )
    {
        Doctor storage d = doctors[_doctor];
        return (d.name, d.specialization, d.license, d.rating, d.totalRatings, d.isVerified, d.exists);
    }

    // =========================
    // APPOINTMENT FUNCTIONS
    // =========================

    function requestAppointment(
        address _doctor,
        string memory _healthIssue
    ) external {

        require(patients[msg.sender].exists, "Register as patient first");
        require(doctors[_doctor].isVerified, "Doctor not verified");

        uint baseFee = calculateFee(_healthIssue, doctors[_doctor].rating);

        appointments.push(
            Appointment({
                id: appointments.length,
                patient: msg.sender,
                doctor: _doctor,
                healthIssue: _healthIssue,
                consultationFee: baseFee,
                approved: false,
                rejected: false,
                meetingLink: "",
                paid: false,
                treatmentFee: 0,
                treatmentPaid: false,
                completed: false,
                rated: false,
                prescriptionHash: ""
            })
        );

        uint newId = appointments.length - 1;
        emit AppointmentRequested(newId, msg.sender, _doctor, _healthIssue, baseFee);
    }

    function approveAppointment(
        uint _id,
        string memory _meetingLink
    ) external onlyVerifiedDoctor {

        Appointment storage appt = appointments[_id];

        require(appt.doctor == msg.sender, "Not your appointment");
        require(!appt.approved, "Already approved");

        appt.approved = true;
        appt.meetingLink = _meetingLink;
    }

    function rejectAppointment(uint _id) external onlyVerifiedDoctor {
        Appointment storage appt = appointments[_id];
        require(appt.doctor == msg.sender, "Not your appointment");
        require(!appt.approved, "Already approved");
        require(!appt.rejected, "Already rejected");

        appt.rejected = true;
        emit AppointmentRejected(_id, msg.sender);
    }

    function payConsultation(uint _id) external payable {
        Appointment storage appt = appointments[_id];

        require(appt.patient == msg.sender, "Not your appointment");
        require(appt.approved, "Not approved yet");
        require(!appt.paid, "Already paid");
        require(msg.value == appt.consultationFee, "Incorrect amount");

        appt.paid = true;
        doctorEarnings[appt.doctor] += msg.value;
        payable(appt.doctor).transfer(msg.value);

        emit ConsultationPaid(_id, appt.patient, appt.doctor, msg.value);
    }

    function setTreatmentFee(uint _id, uint _treatmentFee) external onlyVerifiedDoctor {
        Appointment storage appt = appointments[_id];
        require(appt.doctor == msg.sender, "Not your appointment");
        require(appt.approved, "Not approved yet");
        require(appt.paid, "Consultation not paid");
        require(!appt.completed, "Already completed");
        require(_treatmentFee > 0, "Treatment fee must be > 0");
        appt.treatmentFee = _treatmentFee;

        emit TreatmentFeeSet(_id, msg.sender, _treatmentFee);
    }

    function payTreatment(uint _id) external payable {
        Appointment storage appt = appointments[_id];
        require(appt.patient == msg.sender, "Not your appointment");
        require(appt.approved, "Not approved yet");
        require(appt.paid, "Consultation not paid");
        require(appt.treatmentFee > 0, "Treatment fee not set");
        require(!appt.treatmentPaid, "Treatment already paid");
        require(msg.value == appt.treatmentFee, "Incorrect amount");
        appt.treatmentPaid = true;
        doctorEarnings[appt.doctor] += msg.value;
        payable(appt.doctor).transfer(msg.value);

        emit TreatmentPaid(_id, appt.patient, appt.doctor, msg.value);
    }

    function completeAppointment(uint _id) external onlyVerifiedDoctor {
        Appointment storage appt = appointments[_id];
        require(appt.doctor == msg.sender, "Not your appointment");
        require(appt.paid, "Consultation not paid");
        require(appt.treatmentFee == 0 || appt.treatmentPaid, "Treatment not paid");
        appt.completed = true;

        emit AppointmentCompleted(_id, msg.sender);
    }

    // =========================
    // RATING SYSTEM
    // =========================

    function rateDoctor(uint _appointmentId, uint _rating) external {
        require(_rating >= 1 && _rating <= 5, "Invalid rating");
        Appointment storage appt = appointments[_appointmentId];
        require(appt.patient == msg.sender, "Not your appointment");
        require(appt.completed, "Appointment not completed");
        require(!appt.rated, "Already rated");
        address _doctor = appt.doctor;
        require(doctors[_doctor].exists, "Doctor not found");

        Doctor storage doc = doctors[_doctor];

        doc.rating =
            (doc.rating * doc.totalRatings + _rating) /
            (doc.totalRatings + 1);

        doc.totalRatings += 1;
        appt.rated = true;

        emit DoctorRated(_appointmentId, msg.sender, _doctor, _rating);
    }

    // =========================
    // PRESCRIPTIONS (IPFS)
    // =========================

    function addPrescription(uint _appointmentId, string calldata _prescriptionHash)
        external
        onlyVerifiedDoctor
        hasPatientConsent(appointments[_appointmentId].patient)
    {
        Appointment storage appt = appointments[_appointmentId];
        require(appt.doctor == msg.sender, "Not your appointment");
        require(appt.completed, "Appointment not completed");
        appt.prescriptionHash = _prescriptionHash;

        emit PrescriptionAdded(_appointmentId, msg.sender, _prescriptionHash);
    }

    // =========================
    // MEDICAL RECORDS
    // =========================

    /**
     * @dev Add a full medical record for a completed appointment.
     * Stores structured diagnosis, prescription text, and an IPFS hash
     * pointing to any attached report file.
     */
    function addMedicalRecord(
        uint256 _appointmentId,
        string calldata _diagnosis,
        string calldata _prescriptionText,
        string calldata _reportHash
    )
        external
        onlyVerifiedDoctor
        hasPatientConsent(appointments[_appointmentId].patient)
    {
        Appointment storage appt = appointments[_appointmentId];
        require(appt.doctor == msg.sender, "Not your appointment");
        require(appt.completed, "Appointment not completed");

        address patientAddr = appt.patient;
        MedicalRecord[] storage list = medicalRecordsByPatient[patientAddr];

        uint256 newId = list.length;
        list.push(
            MedicalRecord({
                id: newId,
                patient: patientAddr,
                doctor: msg.sender,
                appointmentId: _appointmentId,
                diagnosis: _diagnosis,
                prescriptionText: _prescriptionText,
                reportHash: _reportHash,
                createdAt: block.timestamp
            })
        );

        emit MedicalRecordAdded(
            patientAddr,
            msg.sender,
            newId,
            _appointmentId,
            _diagnosis,
            _prescriptionText,
            _reportHash
        );
    }

    /**
     * @dev Patient uploads their own past medical record to IPFS and logs it.
     */
    function addPatientRecord(
        string calldata _diagnosis,
        string calldata _reportHash
    ) external {
        require(patients[msg.sender].exists, "Register as patient first");

        address patientAddr = msg.sender;
        MedicalRecord[] storage list = medicalRecordsByPatient[patientAddr];

        uint256 newId = list.length;
        list.push(
            MedicalRecord({
                id: newId,
                patient: patientAddr,
                doctor: msg.sender,
                appointmentId: 0, // 0 to indicate self-uploaded record
                diagnosis: _diagnosis,
                prescriptionText: "Self-Uploaded Medical Record",
                reportHash: _reportHash,
                createdAt: block.timestamp
            })
        );

        emit MedicalRecordAdded(
            patientAddr,
            msg.sender,
            newId,
            0,
            _diagnosis,
            "Self-Uploaded Medical Record",
            _reportHash
        );
    }

    // =========================
    // VIEW FUNCTIONS
    // =========================

    function getAppointmentCount() external view returns (uint) {
        return appointments.length;
    }

    function getTotalRecordCount() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < patientList.length; i++) {
            total += medicalRecordsByPatient[patientList[i]].length;
        }
        return total;
    }

    function getRecordCount(address _patient) external view returns (uint256) {
        return medicalRecordsByPatient[_patient].length;
    }

    /**
     * @dev Returns all medical records for a patient.
     * - Patient can always read their own records
     * - Admin can read any patient records
     * - Doctors can read if they have a valid AccessNFT consent
     */
    function getRecords(address _patient) external view returns (MedicalRecord[] memory) {
        bool isPatient = msg.sender == _patient;
        bool isAdmin = msg.sender == admin;
        bool hasAccess = accessNFT.hasValidAccess(_patient, msg.sender);

        require(isPatient || isAdmin || hasAccess, "Not authorized to view records");

        return medicalRecordsByPatient[_patient];
    }

    function calculateFee(
        string memory _healthIssue,
        uint _rating
    ) internal pure returns (uint) {

        uint base;

        if (keccak256(bytes(_healthIssue)) == keccak256(bytes("fever"))) {
            base = 1 ether;
        } else if (keccak256(bytes(_healthIssue)) == keccak256(bytes("cancer"))) {
            base = 5 ether;
        } else {
            base = 2 ether;
        }

        // rating multiplier
        uint multiplier = (_rating * 10) / 5; // 10 to 50%

        return base + ((base * multiplier) / 100);
    }
}
