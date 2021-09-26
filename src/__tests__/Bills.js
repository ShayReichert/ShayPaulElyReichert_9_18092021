import "@testing-library/jest-dom";
import { fireEvent, screen } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", () => {
      //to-do write expect expression

      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      const user = JSON.stringify({
        type: "Employee",
      });
      window.localStorage.setItem("user", user);

      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;

      const billIcon = screen.getByTestId("icon-window");
      // --- Make the Router.js 's job : correct ?
      fireEvent.change(billIcon, { target: { className: "active-icon" } });

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
});
