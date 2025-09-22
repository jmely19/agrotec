// Script para el perfil de Juan Pérez

document.addEventListener("DOMContentLoaded", () => {
  console.log("Perfil de Juan Pérez cargado correctamente ✅");

  // Mensaje al hacer clic en productos
  const productos = document.querySelectorAll(".products-list li");
  productos.forEach(item => {
    item.addEventListener("click", () => {
      alert(`Seleccionaste: ${item.innerText}`);
    });
  });
});

// Script para el perfil de Juan Pérez con productos estilo tarjeta
document.addEventListener("DOMContentLoaded", () => {
  console.log("Perfil de Juan Pérez cargado ✅");

  // Botón "Add to Cart"
  const botones = document.querySelectorAll(".add-btn");
  botones.forEach(btn => {
    btn.addEventListener("click", () => {
      alert("Producto agregado al carrito 🛒");
    });
  });
});
