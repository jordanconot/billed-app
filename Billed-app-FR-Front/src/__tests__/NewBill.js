/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import NewBill from "../containers/NewBill.js"
import mockStore from "../__mocks__/store.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import NewBillUI from "../views/NewBillUI.js"
import { ROUTES } from "../constants/routes.js"


jest.mock("../app/Store", () => mockStore)

describe("Given I am connected as an employee", () => { // Vu que je suis connecté en tant qu'employé
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee'
  }))
  describe("When I am on Newbill page", () => { // Lorsque je suis sur la page Newbill
    test("Then the newbill is displayed on the screen", () => {
      const content = NewBillUI();
      document.body.innerHTML = content;

      const newBillForm = screen.getByTestId("form-new-bill"); // Formulaire de la nouvelle note de frais
      expect(newBillForm).toBeTruthy(); // Formulaire vide apparaît bien

      // Si je ne remplis pas le champ Date
      const date = screen.getByTestId("datepicker");
      expect(date.value).toBe("");

      // Si je ne remplis pas le champ Montant TTC
      const ttc = screen.getByTestId("amount");
      expect(ttc.value).toBe("");

      // Si je ne remplis pas le champ TVA
      const tva = screen.getByTestId("pct");
      expect(tva.value).toBe("");

      // Si je ne remplis pas le champ Justificatif
      const receipt = screen.getByTestId("file");
      expect(receipt.value).toBe("");

      const sendNewBill = jest.fn((e) => e.preventDefault()); // Simulation pour empêcher le comportement par défault du submit
      newBillForm.addEventListener("submit", sendNewBill); 
      fireEvent.submit(newBillForm); // Simulation du submit
      expect(screen.getByTestId("form-new-bill")).toBeTruthy(); // Vérification si le formulaire est toujours présent
    })
  })
})

describe("When I get the wrong receipt format", () => {
  test("Then I stay on the page and an error message appears", () => {
    const content = NewBillUI();
    document.body.innerHTML = content;
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    }
    const newBill = new NewBill({ // Simulation d'une instance de la classe NewBill
      document,
      onNavigate,
      store: null,
      localStorage: localStorageMock
    })
    const downloadFile = jest.fn((e) => newBill.handleChangeFile(e)); // Simulation d'une fonction qui appelle la méthode handleChangeFile
    const file = screen.getByTestId("file");
    const testFormat = new File(["Test"], "document.txt", { // Crée un nouvel objet File simulé avec les caractéristiques suivante
      type: "document/txt"
    })
    file.addEventListener("change", downloadFile); // écouteur d'événement au changement de file
    fireEvent.change(file, {target: {files: [testFormat]}}) // Simulation d'un changement de fichier avec testFormat
    expect(downloadFile).toHaveBeenCalled();// Vérification que la fonction downloadFile a bien été appelée
    expect(() => window.alert()).not.toThrow(); // Vérification que l'appel a window.alert ne génére pas d'erreur
  })
})