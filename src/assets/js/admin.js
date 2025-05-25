import PlayerFormHandler from "./admin/formHandler.js";
import PlayerSearchHandler from "./admin/searchHandler.js";
import PlayerPool from "./admin/sessionPool.js";


document.addEventListener('DOMContentLoaded', () => {
  new PlayerFormHandler('.admin_form_add');
  new PlayerSearchHandler('.admin_form_search');
  const playerPoll = new PlayerPool();

  //обрабатываем клики контейнера

  document.getElementById('admin_container').addEventListener('click', async (event) => {
    const target = event.target;

    if (!target.closest('#admin_container')) {
      return;
    }

    //старт
    else if (target.classList.contains('start')) {
      const player_token = target.closest('li').dataset.token;
      const session_token = target.closest('.control')?.dataset?.session;
      await playerPoll.startSession(session_token);

      //стоп
    } else if (target.classList.contains('stop')) {
      await playerPoll.stopActiveSession();

      //сброс результатов
    } else if (target.classList.contains('reset')) {
      playerPoll.loadPool();
    }


    // else if (target.closest('li')) {
    //   const token = target.closest('li').dataset.token;
    //   playerPoll.addToPool(token);
    // }

  });

});
jQuery(document).ready(function ($) {
  const $form = $('[data-form]');
  const $toggle = $('[data-register]');

  // Скрываем форму при загрузке
  $form.hide();

  // По клику по "Регистрация" — переключаем видимость формы
  $toggle.on('click', function () {
    $form.slideToggle(300); // Плавное скрытие/показ
  });
});
