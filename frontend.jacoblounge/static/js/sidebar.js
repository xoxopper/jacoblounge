document.addEventListener("DOMContentLoaded", function(){
    const subjectList = ["home", "travel", "anime", "cards"];

    for (let subject of subjectList) {
        const sidebar = document.getElementById(subject + 'Sidebar');
        const toggleBtn = document.getElementById(subject + 'ToggleBtn');
        const mainContent = document.getElementById('mainContent');

        // Toggle sidebar collapse/expand
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');

            if (sidebar.classList.contains('collapsed')) {
                sidebar.style.width = "35px";
                mainContent.style.marginLeft = '35px';
            }
            else{
                sidebar.style.width = "200px";
                mainContent.style.marginLeft = '200px';
            }
        });

        // Optional: On resize, keep sidebar collapsed on small screens by default
        function handleResize() {
            if (window.innerWidth <= 768) {
                if (!sidebar.classList.contains('collapsed')) {
                    sidebar.classList.add('collapsed');
                }
            } else {
                if (sidebar.classList.contains('collapsed')) {
                    sidebar.classList.remove('collapsed');
                }
            }
        }

        window.addEventListener('resize', handleResize);
        window.addEventListener('load', handleResize);

    }
});
