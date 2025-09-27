import logo from "./logo.svg";
import "./App.css";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Iniciar sesion en Cuenta</p>
        <p>Usuario</p>
        <input type="text" placeholder="Usuario" />
        <p>Contraseña</p>
        <input type="password" placeholder="Contraseña" />
        <br />
        {/*Login construir un boton de acceso */}
        <button>Iniciar sesion</button>
        <p> Registrarse </p>
        <p>¿Olvidaste tu contraseña?</p>
      </header>
    </div>
  );
}

export default App;
