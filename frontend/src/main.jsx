// Importation du mode Strict de React pour détecter les problèmes potentiels
import { StrictMode } from 'react'
// Importation de la fonction createRoot pour créer le point de montage de l'application
import { createRoot } from 'react-dom/client'
// Importation des styles CSS globaux
import './index.css'
// Importation du composant principal App
import App from './App.jsx'

// Création du point de montage de l'application React dans l'élément DOM avec l'ID 'root'
// StrictMode active des vérifications supplémentaires pendant le développement
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
