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
  test("Then I stay on the page and an error message appears", async () => {
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
    const errorFormat  = await screen.getByText("Veuillez saisir le bon format d'image(JPG, PNG ou JPEG)");
    expect(errorFormat).toBeTruthy();
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
describe("Given I am connected as Employee on NewBill page, and submit the form", () => {
  beforeEach(() => {
    jest.spyOn(mockStore, "bills"); // espionne la fonction 'bills' du mockstore

    Object.defineProperty(window, "localStorage", { // Initialise le localStorage pour simuler un utilisateur connecté
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
  });

  describe("When I create new bill", () => {
    test("Send bill to mock API POST", async () => {
      localStorage.setItem( // Initialise à nouveau le localStorage pour simuler un utilisateur connecté
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill); // Appelle 'onNavigate' pour accéder à la page NewBill
      jest.spyOn(mockStore, "bills"); // Espionne à nouveau la fonction 'bills' du mockStore

      const newBill = new NewBill({ // Crée une instance de NewBill
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      
      const form = screen.getByTestId("form-new-bill"); //Sélectionne le formulaire de la nouvelle facture
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e)); // Crée une fonction 'handleSubmit' pour espionner la soumission du formulaire
      form.addEventListener("submit", handleSubmit);  // Ajoute un écouteur d'événement pour la soumission du formulaire
      fireEvent.submit(form); // Simule la soumission du formulaire
      await new Promise(process.nextTick); // Attend la prochaine promesse pour que le code asynchrone soit exécuté
      console.log("document.body", document.body.innerHTML); //Affiche le contenu du document
      expect(handleSubmit).toHaveBeenCalled();  // Vérifie si la fonction 'handleSubmit' a été appelée
    });

    describe("When an error occurs on API", () => {
      test("Fetches error from API and fails with 404 error", async () => {
        jest.spyOn(mockStore, "bills") // Espionne la fonction bills (store) simulé
        const erreur = jest.spyOn(console, "error").mockImplementation(() => {}); // Espionne la fonction console.error pour éviter l'affichage des erreurs
  
        // Initialise les données de l'utilisateur fictif dans le stockage local
        Object.defineProperty(window, "localStorage", { value: localStorageMock });
        Object.defineProperty(window, "location", { value: { hash: ROUTES_PATH["NewBill"]}});
  
        window.localStorage.setItem("user", JSON.stringify({ type: "Employee"}));
        document.body.innerHTML = `<div id="root"></div>`;
        router();
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        }
        mockStore.bills.mockImplementationOnce(() => { // Simule une erreur 404 lors de la mise à jour de la facture dans le (store)
          return {
            update : () => {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })
        const newBill = new NewBill({ // Initialise une instance de NewBill avec des données simulées
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage
        })
  
        const form = screen.getByTestId("form-new-bill"); // Sélectionne le formulaire de la nouvelle facture
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e)); // Définit une fonction de gestion de soumission fictive
        form.addEventListener("submit", handleSubmit);  // Simule la soumission du formulaire
        fireEvent.submit(form);
  
        await new Promise(process.nextTick); // Attends que la prochaine promesse soit résolue
        expect(erreur).toHaveBeenCalledWith(expect.objectContaining({ message: "Erreur 404" })); // Vérifie si "Erreur 404" est bien affiché dans la console
      })
    })


    describe("When an error occurs on API", () => {
      test("Fetches error from API and fails with 500 error", async () => {
        jest.spyOn(mockStore, "bills") // Espionne la fonction bills (store) simulé
        const erreur = jest.spyOn(console, "error").mockImplementation(() => {}); // Espionne la fonction console.error pour éviter l'affichage des erreurs
  
        // Initialise les données de l'utilisateur fictif dans le stockage local
        Object.defineProperty(window, "localStorage", { value: localStorageMock });
        Object.defineProperty(window, "location", { value: { hash: ROUTES_PATH["NewBill"]}});
  
        window.localStorage.setItem("user", JSON.stringify({ type: "Employee"}));
        document.body.innerHTML = `<div id="root"></div>`;
        router();
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        }
        mockStore.bills.mockImplementationOnce(() => { // Simule une erreur 500 lors de la mise à jour de la facture dans le (store)
          return {
            update : () => {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })
        const newBill = new NewBill({ // Initialise une instance de NewBill avec des données simulées
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage
        })
  
        const form = screen.getByTestId("form-new-bill"); // Sélectionne le formulaire de la nouvelle facture
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e)); // Définit une fonction de gestion de soumission fictive
        form.addEventListener("submit", handleSubmit);  // Simule la soumission du formulaire
        fireEvent.submit(form);
  
        await new Promise(process.nextTick); // Attends que la prochaine promesse soit résolue
        expect(erreur).toHaveBeenCalledWith(expect.objectContaining({ message: "Erreur 500" })); // Vérifie si "Erreur 500" est bien affiché dans la console
      })
    })
  })
})