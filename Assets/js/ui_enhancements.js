$(document).ready(function() {
  // Update online count dynamically
  function updateOnlineCount() {
    $.get('/api/online-count', function(data) {
      $('.online-count span').text(data.count.toLocaleString() + '+ people online');
    });
  }
  updateOnlineCount();
  setInterval(updateOnlineCount, 10000);

  // Handle "Coming Soon" features
  $('.btn-outline:contains("Report"), .nav-links a:not(.active), .auth-buttons button').click(function(e) {
    if ($(this).attr('href') === '/' || $(this).hasClass('next-chat')) return;
    e.preventDefault();
    alert('This feature is coming soon to StrangerSync!');
  });

  // Simple feedback for Start Video Chat button
  $('.btn-primary:contains("Start Video Chat")').click(function() {
    $(this).html('Connecting... <div class="dot" style="margin-left: 10px;"></div>');
  });
});
