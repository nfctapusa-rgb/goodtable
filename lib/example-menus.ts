// Example menus shown as Lokly Menu showcases. Names and prices copied from each
// restaurant's own published menu (Nov 2026). Seeded by /api/admin/seed-menus.
type Row = [name: string, price: string, desc?: string];
const sec = (name: string, rows: Row[]) => ({ name, items: rows.map(([n, p, d]) => ({ name: n, price: p, desc: d ?? "" })) });

export const EXAMPLE_MENUS = [
  {
    slug: "corleone-pizza-los-angeles", name: "Corleone Pizza", kind: "restaurant", theme: "bold", color: "#B3261E",
    phone: "(213) 622-7342", address: "310 W 7th St, Los Angeles, CA 90014", city: "Los Angeles",
    website: "https://www.corleonepizzadtla.com", logo: "https://www.corleonepizzadtla.com/assets/photos/logo.png?v=6",
    data: {
      hours: "Monday to Saturday, 6 AM – 6 PM",
      order: "https://www.ubereats.com/store/corleone-pizza-310-w-7th-st/TcrGTpz2XjapnUjCDYm8-A",
      specials: [],
      sections: [
        sec("Pizza", [["1 Topping XL Pizza", "$23.00"], ["2 Toppings XL Pizza", "$25.00"], ["3 Toppings XL Pizza", "$27.00"], ["Supreme XL Pizza", "$30.00"], ["By the Slice", "$4.00"], ["French Baguette", "$4.00 / $6.00", "Half / whole"]]),
        sec("Entrees & platters", [["Lule & Chicken Combo", "$19.95"], ["Lule Kabob", "$15.95"], ["Chicken Kabob", "$14.95"], ["Grilled Salmon", "$19.95"], ["Chicken Salad", "$14.95"]]),
        sec("Pasta", [["Spaghetti", "$13.95"], ["Chicken Alfredo Pasta", "$13.95"]]),
        sec("Sandwiches", [["Chicken Breast Sandwich", "$14.00"], ["Turkey Sandwich", "$13.00"], ["Ham Sandwich", "$13.00"], ["Chicken Thigh Sandwich", "$14.00"], ["Gyro Sandwich", "$13.00"]]),
        sec("Salads & sides", [["Cucumber Salad", "$6.00"], ["Greek Salad", "$10.00"], ["Hummus (Side Order)", "$2.00"], ["French Fries", "$5.00"], ["Perashki Potatoes", "$4.00"], ["Borek Khachapuri", "$3.00"], ["Jalapeño Cream Cheese", "$4.00"]]),
        sec("Coffee & drinks", [["Coffee", "$2.00–$3.00", "Small $2.00 · Medium $2.50 · Large $3.00"], ["Canned Soda", "$2.00"], ["Bottled Water", "$1.50"], ["Bottled Drinks", "$3.50"]]),
      ],
    },
  },
  {
    slug: "flamebachi-los-angeles", name: "Flamebachi", kind: "restaurant", theme: "dark", color: "#E4572E",
    phone: "(951) 756-7017", address: "225 W 7th St, Los Angeles, CA 90014", city: "Los Angeles",
    website: "https://flamebachi.com", logo: "https://flamebachi.com/online-menu/assets/flamebachi-wordmark.png",
    data: {
      order: "https://order.chownow.com/order/28837/locations/61131",
      specials: [{ title: "10% off all Bachi Bowls", desc: "Plus a free soda or 50% off any agua fresca.", when: "Every day until 4 PM" }],
      sections: [
        sec("Single Plates", [
          ["Chicken Breast Plate", "$20.00", "Marinated chicken breast in garlic soy butter, over fried rice and seared veggies."],
          ["NY Steak Plate", "$26.00", "8oz New York steak in garlic soy butter, over fried rice and seared veggies."],
          ["Filet Mignon Plate", "$30.00", "8oz filet in garlic soy butter, over fried rice and seared veggies."],
          ["Salmon Plate", "$25.00", "8oz salmon with garlic soy butter and lemon, over fried rice and seared veggies."],
          ["Shrimp Plate", "$23.00", "Shrimp in garlic soy butter and lemon, over fried rice and seared veggies."],
          ["Scallops Plate", "$25.00", "Seared scallops in garlic soy butter and lemon, over fried rice and seared veggies."],
          ["Lobster Tail Plate", "$36.00", "6oz lobster tail in garlic soy butter and lemon, over fried rice and seared veggies."],
          ["Double Lobster Tail Plate", "$52.00", "Two 6oz lobster tails in garlic soy butter and lemon, over fried rice and seared veggies."],
          ["PorterHouse Plate", "$28.00", "NY steak and filet mignon."],
          ["Seared Ahi Tuna Plate", "$25.00", "Seared rare tuna."]]),
        sec("Double Plates", [["NY Steak & Chicken Plate", "$30.00"], ["Filet Mignon & Chicken Plate", "$32.00"], ["Chicken & Salmon Plate", "$34.00"], ["Chicken & Shrimp Plate", "$34.00"], ["Shrimp & Salmon Plate", "$36.00"], ["NY Steak & Shrimp Plate", "$39.00"], ["NY Steak & Salmon Plate", "$40.00"], ["Filet Mignon & Shrimp Plate", "$41.00"], ["Filet Mignon & Salmon Plate", "$42.00"], ["NY Steak & Lobster Plate", "$45.00"], ["Filet Mignon & Lobster Plate", "$47.00"]]),
        sec("Trio Plates", [["NY Steak, Chicken & Shrimp Plate", "$41.00"], ["Porterhouse, Chicken & Shrimp Plate", "$43.00"], ["NY Steak, Chicken & Salmon Plate", "$43.00"], ["Filet Mignon, Chicken & Shrimp Plate", "$44.00"], ["Salmon, Ahi Tuna & Scallops Plate", "$44.00"], ["Filet Mignon, Chicken & Salmon Plate", "$45.00"], ["Seafood Supreme Plate", "$52.00"], ["NY Steak, Shrimp & Lobster Plate", "$54.00"], ["Filet Mignon, Shrimp & Lobster Plate", "$56.00"]]),
        sec("Double Bowls", [["Shrimp & Chicken Bowl", "$22.00"], ["NY Steak & Shrimp Bowl", "$23.00"], ["Chicken & NY Steak Bowl", "$23.00"], ["Chicken & Salmon Bowl", "$24.00"], ["Filet Mignon & Chicken Bowl", "$25.00"], ["Filet Mignon & Shrimp Bowl", "$26.00"], ["Filet Mignon & Salmon Bowl", "$27.00"], ["NY Steak & Lobster Bowl", "$40.00"], ["Filet Mignon & Lobster Bowl", "$42.00"]]),
        sec("Trio Bowls", [["NY Steak, Chicken Breast & Shrimp Bowl", "$30.00"], ["Filet Mignon, Shrimp & Chicken Breast Bowl", "$32.00"], ["NY Steak, Chicken Breast & Salmon Bowl", "$33.00"], ["Salmon, Ahi Tuna & Scallops Bowl", "$34.00"], ["Filet Mignon, Chicken Breast & Salmon Bowl", "$35.00"], ["NY Steak, Shrimp & Lobster Bowl", "$43.00"], ["Filet Mignon, Shrimp & Lobster Bowl", "$45.00"]]),
        sec("Bachi-rritos", [["Chicken Breast Bachi-rrito", "$12.00"], ["Shrimp Bachi-rrito", "$14.00"], ["Salmon Bachi-rrito", "$15.00"], ["Ahi Tuna Bachi-rrito", "$15.00"], ["Scallops Bachi-rrito", "$15.00"], ["NY Steak Bachi-rrito", "$16.00"], ["Filet Mignon Bachi-rrito", "$18.00"], ["NY Steak Trio Bachi-rrito", "$27.00"], ["Lobster Bachi-rrito", "$31.00"], ["Surf & Turf Bachi-rrito", ""]]),
        sec("A La Carte", [["Chicken Breast", "$14.00"], ["Scallops", "$18.00"], ["Shrimp", "$18.50"], ["Salmon", "$19.00"], ["Seared Ahi Tuna", "$19.00"], ["New York Steak", "$20.00"], ["Filet Mignon", "$21.00"], ["Porter House", "$21.00"], ["Lobster Tail", "$25.00"]]),
        sec("Add-Ons", [["Tofu", "$2.00"], ["Sumo Style", "$2.50", "Two fried eggs cooked to order, over anything."], ["Make it Breakfast Style", "$5.00", "Two fried eggs, fries and bacon, over anything."], ["Chicken Breast Add-on", "$9.00"], ["Scallops Add-on", "$9.00"], ["New York Steak Add-on", "$10.00"], ["Salmon Add-on", "$10.00"], ["Shrimp Add-on", "$10.00"], ["Filet Mignon Add-on", "$11.00"]]),
        sec("Sides", [["White Rice", "$6.00"], ["Garlic Noodles", "$9.00", "Egg noodles, scallion, carrot and onion in garlic butter and soy."], ["Chicken Fried Rice", "$13.50"], ["Shrimp Fried Rice", "$15.50"]]),
        sec("Sauces", [["Dragon Sauce", "$1.00"], ["Agave Chile Sauce", "$1.00"], ["Lava Sauce", "$1.25"], ["Garlic Butter Sauce", "$1.50"]]),
        sec("Beverages", [["Water", "$1.50"], ["Canned Soda", "$2.00"], ["House-Made Fresh Lime Soda", "$5.50"]]),
      ],
    },
  },
];
