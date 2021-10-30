import "@testing-library/jest-dom";
import { fireEvent, screen } from "@testing-library/dom";
import user from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { bills } from "../fixtures/bills.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import Router from "../app/Router.js";
import firestore from "../app/Firestore.js";

describe("Given I am connected as an employee", () => {
  // Spy console.log messages
  const consoleSpy = jest.spyOn(console, "log").mockImplementation();
  beforeEach(() => {
    consoleSpy.mockClear();
  });

  // Set localStorage with "User" connexion
  beforeAll(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    const user = JSON.stringify({
      type: "Employee",
      email: "test@test.com",
    });
    window.localStorage.setItem("user", user);
  });

  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", () => {
      // Firestore Mock
      jest.mock("../app/Firestore.js");
      firestore.bills = () => ({ bills, get: jest.fn().mockResolvedValue() });

      // Set "/bill/new" page
      Object.defineProperty(window, "location", { value: { hash: ROUTES_PATH["NewBill"] } });
      document.body.innerHTML = '<div id="root"></div>';
      Router();

      const mailIcon = screen.getByTestId("icon-mail");
      expect(mailIcon).toBeTruthy();
      expect(mailIcon).toHaveClass("active-icon");
    });
  });

  describe("When I don't fill required fields and I click on send button", () => {
    test("Then I should stay in current page (NewBill page)", () => {
      document.body.innerHTML = NewBillUI();

      const inputDatepicker = screen.getByTestId("datepicker");
      expect(inputDatepicker.value).toBe("");

      const inputAmount = screen.getByTestId("amount");
      expect(inputAmount.value).toBe("");

      const inputPct = screen.getByTestId("pct");
      expect(inputPct.value).toBe("");

      const inputFile = screen.getByTestId("file").files[0];
      expect(inputFile).toBeFalsy;

      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn((e) => e.preventDefault());

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });
  });

  describe("When I pass an incorrect file format to 'isCorrectFormat' function", () => {
    test("Then It should return false", () => {
      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const firestore = null;

      const newBill = new NewBill({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage,
      });

      const fileNameMock = "file-test.pdf";

      expect(newBill.isCorrectFomart(fileNameMock)).toBe(false);
    });
  });

  describe("When I upload an incorrect file format in upload file input", () => {
    test("Then It should console.log an error message", () => {
      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const firestore = null;

      const newBill = new NewBill({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage,
      });

      const inputFile = screen.getByTestId("file");
      const file = new File(["incorrect-file.pdf"], "incorrect-file.pdf", { type: "pdf" });

      jest.spyOn(newBill, "isCorrectFomart").mockReturnValue(false);

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      inputFile.addEventListener("change", handleChangeFile);
      user.upload(inputFile, file);
      expect(inputFile.files[0].name).toBe("incorrect-file.pdf");

      expect(console.log).toBeCalledTimes(2);
      expect(console.log).toHaveBeenLastCalledWith("Format d'image non valide !");
    });
  });

  describe("When I fill image field with a correct format file", () => {
    test("Then It should upload a file", () => {
      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const firestore = null;

      const newBill = new NewBill({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage,
      });

      const inputFile = screen.getByTestId("file");
      const file = new File(["facture-test"], "facture-test.png", { type: "image/png" });

      jest.spyOn(newBill, "isCorrectFomart").mockReturnValue(true);

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      inputFile.addEventListener("change", handleChangeFile);
      user.upload(inputFile, file);

      expect(inputFile.files).toHaveLength(1);
      expect(inputFile.files[0].name).toBe("facture-test.png");
      expect(inputFile.files[0]).toStrictEqual(file);

      expect(console.log).toBeCalledTimes(0);
      expect(handleChangeFile).toHaveBeenCalled();
    });
  });

  describe("When I fill required fields and upload an image with a correct format file and click on Send button", () => {
    test("Then It should renders Bills page", () => {
      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const firestore = null;

      const newBill = new NewBill({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage,
      });

      const inputData = {
        date: "2021-09-03",
        amount: "99",
        pct: "19",
      };

      const inputDatepicker = screen.getByTestId("datepicker");
      fireEvent.change(inputDatepicker, { target: { value: inputData.date } });
      expect(inputDatepicker.value).toBe(inputData.date);

      const inputAmount = screen.getByTestId("amount");
      fireEvent.change(inputAmount, { target: { value: inputData.amount } });
      expect(inputAmount.value).toBe(inputData.amount);

      const inputPct = screen.getByTestId("pct");
      fireEvent.change(inputPct, { target: { value: inputData.pct } });
      expect(inputPct.value).toBe(inputData.pct);

      const inputFile = screen.getByTestId("file");
      const file = new File(["facture-test"], "facture-test.png", { type: "image/png" });

      jest.spyOn(newBill, "isCorrectFomart").mockReturnValue(true);

      user.upload(inputFile, file);
      expect(inputFile.files[0]).toStrictEqual(file);
      expect(inputFile.files).toHaveLength(1);

      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
      expect(screen.queryByText("Mes notes de frais")).toBeTruthy();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
