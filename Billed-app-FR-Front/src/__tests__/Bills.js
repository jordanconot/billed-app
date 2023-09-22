/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store.js"
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      // [Ajout de tests unitaires et d'intégration] àjout de expect
      expect(windowIcon).toHaveClass('highlighted');

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})
describe("When I click a button new bill", () => { // Au clique sur le bouton nouvelle note de frais
  test("Then newbill page appears", () => { // Vérifier qu'on est bien sur la page NewBill
    const onNavigate = (pathname) => { // Chemin d'accès
      document.body.innerHTML = ROUTES({ pathname });
    };
    const billsPage = new Bills({
      document,
      onNavigate,
      store: null,
      bills: bills,
      localStorage: window.localStorage
    })
    //constante pour la fonction qui appel la fonction à tester
    const OpenNewBill = jest.fn(billsPage.handleClickNewBill);
    const btnNewBill = screen.getByTestId("btn-new-bill");
    btnNewBill.addEventListener("click", OpenNewBill);
    fireEvent.click(btnNewBill); // Simulation du clique
    //Vérification si la fonction est appelée et que la page s'affiche
    expect(OpenNewBill).toHaveBeenCalled();// S'attendre à ce que la page new bill a été appelé
    expect(screen.getByText("Envoyer une note de frais")).toBeTruthy() // La nouvelle note de frais apparaît avec le titre "Envoyer une note de frais"
  }) 
})

describe("When I click on first eye icon", () => { // Au clique sur l'icône du premier oeil
  test("Then modal should open", () => { // Vérifier si la modal s'ouvre
    Object.defineProperty(window, localStorage, { value: localStorageMock }); // Simulation des données dans le localstorage
    window.localStorage.setItem("user", JSON.stringify({ type: "Employee" })); // Simulation d'un employé connecté
    const html = BillsUI({ data: bills }); // Création de la constante pour la facture employé
    document.body.innerHTML = html;

    const onNavigate = (pathname) => { // Navigation vers bills
      document.body.innerHTML = ROUTES({ pathname });
    };
    const billsContainer = new Bills({ // Création d'une facture
      document,
      onNavigate,
      localStorage: localStorageMock,
      store: null
    });
    // Affichage de la modale
    $.fn.modal = jest.fn();

    const handleClickIconEye = jest.fn(() => { // Simulation du clique
      billsContainer.handleClickIconEye;
    });
    const firstEyeIcon = screen.getAllByTestId("icon-eye")[0];
    firstEyeIcon.addEventListener("click", handleClickIconEye);
    fireEvent.click(firstEyeIcon); // Simulation du clique sur l'icon
    expect(handleClickIconEye).toHaveBeenCalled(); // Vérifier si l'événement au clique a été appeler
    expect($.fn.modal).toHaveBeenCalled(); // Vérifier si la modale est appeler
  })
})
