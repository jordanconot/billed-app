/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom"
import NewBill from "../containers/NewBill.js"
import mockStore from "../__mocks__/store.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import NewBillUI from "../views/NewBillUI.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import router from "../app/Router.js";


jest.mock("../app/Store", () => mockStore);
window.alert = jest.fn();

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

describe('When I get the right receipt format', () => {
  test('Then the form is submitted successfully and data is processed', async () => {
    const content = NewBillUI();
    document.body.innerHTML = content;
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    }
    const newBill = new NewBill({ // Simulation d'une instance de la classe NewBill
      document,
      onNavigate,
      store: mockStore,
      localStorage: localStorageMock
    })

    const downloadFile = jest.fn((e) => newBill.handleChangeFile(e)); // Simulation d'une fonction qui appelle la méthode handleChangeFile
    const file = screen.getByTestId("file");
    const testFormat = new File(['Test'], 'document.jpg', { // Crée un nouvel objet File simulé avec les caractéristiques suivante
      type: 'image/jpeg',
    });

    file.addEventListener("change", downloadFile); // écouteur d'événement au changement de file
    fireEvent.change(file, { target: { files: [testFormat] } }); // Simulation d'un changement de fichier avec testFormat
    expect(downloadFile).toHaveBeenCalled(); // Vérification que la fonction downloadFile a bien été appelée


    const sendNewBill = jest.fn((e) => e.preventDefault()); //Crée une fonction de simulation pour empêcher le comportement par défaut de la soumission du formulaire
    const formNewBill = screen.getByTestId('form-new-bill'); // Sélectionne le formulaire avec l'attribut data-testid "form-new-bill"
    formNewBill.addEventListener('submit', sendNewBill); // Ajoute un écouteur d'événement "submit" au formulaire pour appeler sendNewBill lors de la soumission
    fireEvent.submit(formNewBill); // Déclenche manuellement l'événement de soumission du formulaire
  });
});

//Test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I submit the form completed", () => {
    test("Then the bill is created", async() => {
      const content = NewBillUI();  // Crée le contenu de la page NewBill
      document.body.innerHTML = content; // Injecte le contenu dans le corps du document
      const onNavigate = (pathname) => { // Définit une fonction de navigation fictive
        document.body.innerHTML = ROUTES({ pathname });
      };
      Object.defineProperty(window, "localStorage", { value: localStorageMock });  // Initialise une instance de NewBill avec des données simulées
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee",
        email: "a@a",
      }))
      const newBillComponent = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage
      })
      const validBill = {  // données de facture valide
        "vat": "80",
        "fileUrl": "../img/0.jpg",
        "status": "pending",
        "type": "Vol",
        "commentary": "séminaire billed",
        "name": "Montpellier Paris",
        "fileName": "test.jpg",
        "date": "2004-04-04",
        "amount": 400,
        "pct": 20
      };

      // Remplit les champs du formulaire avec les données de facture simulées
      screen.getByTestId("vat").value = validBill.vat;
      newBillComponent.fileUrl = validBill.fileUrl
      screen.getByTestId("expense-type").value = validBill.type;
      screen.getByTestId("commentary").value = validBill.commentary;
      screen.getByTestId("expense-name").value = validBill.name;
      newBillComponent.fileName = validBill.fileName;
      screen.getByTestId("datepicker").value = validBill.date;
      screen.getByTestId("amount").value = validBill.amount;
      screen.getByTestId("pct").value = validBill.pct;

      // Simule la soumission du formulaire
      newBillComponent.updateBill = jest.fn();
      const handleSubmit = jest.fn((e) => newBillComponent.handleSubmit(e));

      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled(); // Vérifie que la fonction handleSubmit a été appelée
      expect(newBillComponent.updateBill).toHaveBeenCalled(); // Vérifie que la fonction updateBill a été appelée
    })

    test("Fetches error from API and fails with 500 error", async () => {
      jest.spyOn(mockStore, "bills") // Espionne la fonction bills du magasin (store) simulé
      jest.spyOn(console, "error").mockImplementation(() => {}); // Espionne la fonction console.error pour éviter l'affichage des erreurs

      // Initialise les données de l'utilisateur fictif dans le stockage local
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      Object.defineProperty(window, "location", { value: { hash: ROUTES_PATH["NewBill"]}});

      window.localStorage.setItem("user", JSON.stringify({ type: "Employee"}));
      document.body.innerHTML = `<div id="root"></div>`;
      router();
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      }
      mockStore.bills.mockImplementationOnce(() => { // Simule une erreur 500 lors de la mise à jour de la facture dans le magasin (store)
        return {
          update : () => {
            return Promise.reject(new Error("Erreur 500"))
          }
        }
      })
      const newBillComponent = new NewBill({ // Initialise une instance de NewBill avec des données simulées
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const form = screen.getByTestId("form-new-bill"); // Sélectionne le formulaire de la nouvelle facture
      const handleSubmit = jest.fn((e) => newBillComponent.handleSubmit(e)); // Définit une fonction de gestion de soumission fictive
      form.addEventListener("submit", handleSubmit);  // Simule la soumission du formulaire
      fireEvent.submit(form);
      await new Promise(process.nextTick); // Attends que la prochaine promesse soit résolue
      expect(console.error).toBeCalled(); // Vérifie que la fonction console.error a été appelée
    })
  })
})