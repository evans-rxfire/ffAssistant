// Dropdown Toggle
const dropdownBtn = document.getElementById('dropdown-toggle');
const dropdownMenu = document.getElementById('dropdown-menu');

if (dropdownBtn && dropdownMenu) {
    dropdownBtn.addEventListener('click', () => {
        console.log('Dropdown button clicked'); // Logs when button is clicked
        dropdownMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        setTimeout(() => {
        if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            console.log('Clicked outside dropdown'); // Logs when clicked elsewhere
            dropdownMenu.classList.add('hidden');
        }
        }, 10);
    });
}