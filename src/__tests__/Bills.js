import "@testing-library/jest-dom";
import { screen } from "@testing-library/dom";
import { bills } from "../fixtures/bills.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import Router from "../app/Router.js";
import firestore from "../app/Firestore.js";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import userEvent from "@testing-library/user-event";

// Set localStorage with "User" connexion
beforeAll(() => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
  const user = JSON.stringify({
    type: "Employee",
  });
  window.localStorage.setItem("user", user);
});

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", () => {
      // Firestore Mock
      jest.mock("../app/Firestore.js");
      firestore.bills = () => ({ bills, get: jest.fn().mockResolvedValue() });

      // Set "/bills" page
      Object.defineProperty(window, "location", { value: { hash: ROUTES_PATH["Bills"] } });
      document.body.innerHTML = '<div id="root"></div>';
      Router();

      const billIcon = screen.getByTestId("icon-window");
      expect(billIcon).toBeTruthy();
      expect(billIcon).toHaveClass("active-icon");
    });

    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  describe("When I am on Bills page but back-end send an error message", () => {
    test("Then, Error page should be rendered", () => {
      const html = BillsUI({ error: "some error message" });
      document.body.innerHTML = html;
      expect(screen.getAllByText("Erreur")).toBeTruthy();
    });
  });

  describe("When I am on Bills Page and click on icon eye", () => {
    test("Then a modal should open", () => {
      const firstBill = bills.slice(0, 1);
      const html = BillsUI({ data: firstBill });
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const firestore = null;
      const billsContainer = new Bills({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage,
      });

      const handleClickIconEye = jest.fn(billsContainer.handleClickIconEye);
      const eye = screen.getByTestId("icon-eye");

      eye.addEventListener("click", handleClickIconEye(eye));
      userEvent.click(eye);
      expect(handleClickIconEye).toHaveBeenCalled();

      const modale = screen.getByTestId("modaleFileUser");
      expect(modale).toBeTruthy();
    });
  });

  describe("When I am on Bills Page and click on New Bill button", () => {
    test("Then I should see a New Bill form", () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const firestore = null;
      const billsContainer = new Bills({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage,
      });

      const handleClickOnButton = jest.fn(billsContainer.handleClickNewBill);
      const button = screen.getByTestId("btn-new-bill");

      button.addEventListener("click", handleClickOnButton);
      userEvent.click(button);
      expect(handleClickOnButton).toHaveBeenCalled();

      expect(screen.queryByText("Envoyer une note de frais")).toBeTruthy();
    });
  });

  // Pour tester "handleClickOnNewBill" : inspi "When I click on refuse button" de Dashboard.js
});
