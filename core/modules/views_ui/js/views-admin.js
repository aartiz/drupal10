/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal, drupalSettings) {
  Drupal.viewsUi = {};
  Drupal.behaviors.viewsUiEditView = {
    attach() {
      $('[data-drupal-selector="edit-query-options-disable-sql-rewrite"]').on('click', () => {
        $('.sql-rewrite-warning').toggleClass('js-hide');
      });
    }

  };
  Drupal.behaviors.viewsUiAddView = {
    attach(context) {
      const $context = $(context);
      const exclude = new RegExp('[^a-z0-9\\-]+', 'g');
      const replace = '-';
      let suffix;
      const $fields = $context.find('[id^="edit-page-title"], [id^="edit-block-title"], [id^="edit-page-link-properties-title"]');

      if ($fields.length) {
        if (!this.fieldsFiller) {
          this.fieldsFiller = new Drupal.viewsUi.FormFieldFiller($fields);
        } else {
          this.fieldsFiller.rebind($fields);
        }
      }

      const $pathField = $context.find('[id^="edit-page-path"]');

      if ($pathField.length) {
        if (!this.pathFiller) {
          this.pathFiller = new Drupal.viewsUi.FormFieldFiller($pathField, exclude, replace);
        } else {
          this.pathFiller.rebind($pathField);
        }
      }

      const $feedField = $context.find('[id^="edit-page-feed-properties-path"]');

      if ($feedField.length) {
        if (!this.feedFiller) {
          suffix = '.xml';
          this.feedFiller = new Drupal.viewsUi.FormFieldFiller($feedField, exclude, replace, suffix);
        } else {
          this.feedFiller.rebind($feedField);
        }
      }
    }

  };

  Drupal.viewsUi.FormFieldFiller = function ($target, exclude, replace, suffix) {
    this.source = $('#edit-label');
    this.target = $target;
    this.exclude = exclude || false;
    this.replace = replace || '';
    this.suffix = suffix || '';
    const self = this;

    this.populate = function () {
      return self._populate.call(self);
    };

    this.unbind = function () {
      return self._unbind.call(self);
    };

    this.bind();
  };

  $.extend(Drupal.viewsUi.FormFieldFiller.prototype, {
    bind() {
      this.unbind();
      this.source.on('keyup.viewsUi change.viewsUi', this.populate);
      this.target.on('focus.viewsUi', this.unbind);
    },

    getTransliterated() {
      let from = this.source.length ? this.source[0].value : '';

      if (this.exclude) {
        from = from.toLowerCase().replace(this.exclude, this.replace);
      }

      return from;
    },

    _populate() {
      const transliterated = this.getTransliterated();
      const suffix = this.suffix;
      this.target.each(function (i) {
        const maxlength = $(this).attr('maxlength') - suffix.length;
        this.value = transliterated.substr(0, maxlength) + suffix;
      });
    },

    _unbind() {
      this.source.off('keyup.viewsUi change.viewsUi', this.populate);
      this.target.off('focus.viewsUi', this.unbind);
    },

    rebind($fields) {
      this.target = $fields;
      this.bind();
    }

  });
  Drupal.behaviors.addItemForm = {
    attach(context) {
      const $context = $(context);
      let $form = $context;

      if (!$context.is('form[id^="views-ui-add-handler-form"]')) {
        $form = $context.find('form[id^="views-ui-add-handler-form"]');
      }

      if (once('views-ui-add-handler-form', $form).length) {
        new Drupal.viewsUi.AddItemForm($form);
      }
    }

  };

  Drupal.viewsUi.AddItemForm = function ($form) {
    this.$form = $form;
    this.$form.find('.views-filterable-options :checkbox').on('click', $.proxy(this.handleCheck, this));
    this.$selected_div = this.$form.find('.views-selected-options').parent();
    this.$selected_div.hide();
    this.checkedItems = [];
  };

  Drupal.viewsUi.AddItemForm.prototype.handleCheck = function (event) {
    const $target = $(event.target);
    const label = $target.closest('td').next().html().trim();

    if ($target.is(':checked')) {
      this.$selected_div.show().css('display', 'block');
      this.checkedItems.push(label);
    } else {
      const position = $.inArray(label, this.checkedItems);

      for (let i = 0; i < this.checkedItems.length; i++) {
        if (i === position) {
          this.checkedItems.splice(i, 1);
          i--;
          break;
        }
      }

      if (this.checkedItems.length === 0) {
        this.$selected_div.hide();
      }
    }

    this.refreshCheckedItems();
  };

  Drupal.viewsUi.AddItemForm.prototype.refreshCheckedItems = function () {
    this.$selected_div.find('.views-selected-options').html(this.checkedItems.join(', ')).trigger('dialogContentResize');
  };

  Drupal.behaviors.viewsUiRenderAddViewButton = {
    attach(context) {
      const menu = once('views-ui-render-add-view-button', '#views-display-menu-tabs', context);

      if (!menu.length) {
        return;
      }

      const $menu = $(menu);
      const $addDisplayDropdown = $(`<li class="add"><a href="#"><span class="icon add"></span>${Drupal.t('Add')}</a><ul class="action-list" style="display:none;"></ul></li>`);
      const $displayButtons = $menu.nextAll('input.add-display').detach();
      $displayButtons.appendTo($addDisplayDropdown.find('.action-list')).wrap('<li>').parent().eq(0).addClass('first').end().eq(-1).addClass('last');
      $displayButtons.each(function () {
        const $this = $(this);
        this.value = $this.attr('data-drupal-dropdown-label');
      });
      $addDisplayDropdown.appendTo($menu);
      $menu.find('li.add > a').on('click', function (event) {
        event.preventDefault();
        const $trigger = $(this);
        Drupal.behaviors.viewsUiRenderAddViewButton.toggleMenu($trigger);
      });
      $('li.add', $menu).on('mouseleave', function (event) {
        const $this = $(this);
        const $trigger = $this.children('a[href="#"]');

        if ($this.children('.action-list').is(':visible')) {
          Drupal.behaviors.viewsUiRenderAddViewButton.toggleMenu($trigger);
        }
      });
    }

  };

  Drupal.behaviors.viewsUiRenderAddViewButton.toggleMenu = function ($trigger) {
    $trigger.parent().toggleClass('open');
    $trigger.next().slideToggle('fast');
  };

  Drupal.behaviors.viewsUiSearchOptions = {
    attach(context) {
      const $context = $(context);
      let $form = $context;

      if (!$context.is('form[id^="views-ui-add-handler-form"]')) {
        $form = $context.find('form[id^="views-ui-add-handler-form"]');
      }

      if (once('views-ui-filter-options', $form).length) {
        new Drupal.viewsUi.OptionsSearch($form);
      }
    }

  };

  Drupal.viewsUi.OptionsSearch = function ($form) {
    this.$form = $form;
    this.$form.on('click', 'td.title', event => {
      const $target = $(event.currentTarget);
      $target.closest('tr').find('input').trigger('click');
    });
    const searchBoxSelector = '[data-drupal-selector="edit-override-controls-options-search"]';
    const controlGroupSelector = '[data-drupal-selector="edit-override-controls-group"]';
    this.$form.on('formUpdated', `${searchBoxSelector},${controlGroupSelector}`, $.proxy(this.handleFilter, this));
    this.$searchBox = this.$form.find(searchBoxSelector);
    this.$controlGroup = this.$form.find(controlGroupSelector);
    this.options = this.getOptions(this.$form.find('.filterable-option'));
    this.$searchBox.on('keypress', event => {
      if (event.which === 13) {
        event.preventDefault();
      }
    });
  };

  $.extend(Drupal.viewsUi.OptionsSearch.prototype, {
    getOptions($allOptions) {
      let $title;
      let $description;
      let $option;
      const options = [];
      const length = $allOptions.length;

      for (let i = 0; i < length; i++) {
        $option = $($allOptions[i]);
        $title = $option.find('.title');
        $description = $option.find('.description');
        options[i] = {
          searchText: `${$title[0].textContent.toLowerCase()} ${$description[0].textContent.toLowerCase()}
              .toLowerCase()}`,
          $div: $option
        };
      }

      return options;
    },

    handleFilter(event) {
      const search = this.$searchBox[0].value.toLowerCase();
      const words = search.split(' ');
      const group = this.$controlGroup[0].value;
      this.options.forEach(option => {
        function hasWord(word) {
          return option.searchText.indexOf(word) !== -1;
        }

        let found = true;

        if (search) {
          found = words.every(hasWord);
        }

        if (found && group !== 'all') {
          found = option.$div.hasClass(group);
        }

        option.$div.toggle(found);
      });
      $(event.target).trigger('dialogContentResize');
    }

  });
  Drupal.behaviors.viewsUiPreview = {
    attach(context) {
      const $contextualFiltersBucket = $(context).find('.views-display-column .views-ui-display-tab-bucket.argument');

      if ($contextualFiltersBucket.length === 0) {
        return;
      }

      const $contextualFilters = $contextualFiltersBucket.find('.views-display-setting a');

      if ($contextualFilters.length) {
        $('#preview-args').parent().show();
      } else {
        $('#preview-args').parent().hide();
      }

      if ($(once('edit-displays-live-preview', '#edit-displays-live-preview')).is(':checked')) {
        $(once('edit-displays-live-preview', '#preview-submit')).trigger('click');
      }
    }

  };

  Drupal.viewsUi.RearrangeFilterHandler = function ($table, $operator) {
    this.table = $table;
    this.operator = $operator;
    this.hasGroupOperator = this.operator.length > 0;
    this.draggableRows = $table.find('.draggable');
    this.addGroupButton = $('#views-add-group');
    this.removeGroupButtons = $table.find('.views-remove-group');
    this.insertAddRemoveFilterGroupLinks();

    if (this.hasGroupOperator) {
      this.dropdowns = this.duplicateGroupsOperator();
      this.syncGroupsOperators();
    }

    this.modifyTableDrag();
    this.redrawOperatorLabels();
    $(once('views-rearrange-filter-handler', $table.find('.views-group-title select'))).on('change.views-rearrange-filter-handler', $.proxy(this, 'redrawOperatorLabels'));
    $(once('views-rearrange-filter-handler', $table.find('a.views-groups-remove-link'))).on('click.views-rearrange-filter-handler', $.proxy(this, 'updateRowspans')).on('click.views-rearrange-filter-handler', $.proxy(this, 'redrawOperatorLabels'));
  };

  $.extend(Drupal.viewsUi.RearrangeFilterHandler.prototype, {
    insertAddRemoveFilterGroupLinks() {
      $(once('views-rearrange-filter-handler', $(`<ul class="action-links"><li><a id="views-add-group-link" href="#">${this.addGroupButton[0].value}</a></li></ul>`).prependTo(this.table.parent()))).find('#views-add-group-link').on('click.views-rearrange-filter-handler', $.proxy(this, 'clickAddGroupButton'));
      const length = this.removeGroupButtons.length;
      let i;

      for (i = 0; i < length; i++) {
        const $removeGroupButton = $(this.removeGroupButtons[i]);
        const buttonId = $removeGroupButton.attr('id');
        $(once('views-rearrange-filter-handler', $(`<a href="#" class="views-remove-group-link">${Drupal.t('Remove group')}</a>`).insertBefore($removeGroupButton))).on('click.views-rearrange-filter-handler', {
          buttonId
        }, $.proxy(this, 'clickRemoveGroupButton'));
      }
    },

    clickAddGroupButton(event) {
      this.addGroupButton.trigger('mousedown');
      event.preventDefault();
    },

    clickRemoveGroupButton(event) {
      this.table.find(`#${event.data.buttonId}`).trigger('mousedown');
      event.preventDefault();
    },

    duplicateGroupsOperator() {
      let newRow;
      let titleRow;
      const titleRows = once('duplicateGroupsOperator', 'tr.views-group-title');

      if (!titleRows.length) {
        return this.operator;
      }

      this.operator.find('label').add('div.description').addClass('visually-hidden');
      this.operator.find('select').addClass('form-select');
      const dropdowns = this.operator;
      titleRow = $('tr#views-group-title-2');
      newRow = $('<tr class="filter-group-operator-row"><td colspan="5"></td></tr>');
      newRow.find('td').append(this.operator);
      newRow.insertBefore(titleRow);
      const length = titleRows.length;

      for (let i = 2; i < length; i++) {
        titleRow = $(titleRows[i]);
        const fakeOperator = this.operator.clone();
        fakeOperator.attr('id', '');
        newRow = $('<tr class="filter-group-operator-row"><td colspan="5"></td></tr>');
        newRow.find('td').append(fakeOperator);
        newRow.insertBefore(titleRow);
        dropdowns.add(fakeOperator);
      }

      return dropdowns;
    },

    syncGroupsOperators() {
      if (this.dropdowns.length < 2) {
        return;
      }

      this.dropdowns.on('change', $.proxy(this, 'operatorChangeHandler'));
    },

    operatorChangeHandler(event) {
      const $target = $(event.target);
      const operators = this.dropdowns.find('select').not($target);
      operators.each(function (index, item) {
        item.value = $target[0].value;
      });
    },

    modifyTableDrag() {
      const tableDrag = Drupal.tableDrag['views-rearrange-filters'];
      const filterHandler = this;

      tableDrag.row.prototype.onSwap = function () {
        if (filterHandler.hasGroupOperator) {
          const thisRow = $(this.group);
          const previousRow = thisRow.prev('tr');

          if (previousRow.length && !previousRow.hasClass('group-message') && !previousRow.hasClass('draggable')) {
            const next = thisRow.next();

            if (next.is('tr')) {
              this.swap('after', next);
            }
          }

          filterHandler.updateRowspans();
        }

        filterHandler.redrawOperatorLabels();
      };

      tableDrag.onDrop = function () {
        const changeMarker = $(this.oldRowElement).find('.tabledrag-changed');

        if (changeMarker.length) {
          const operatorLabel = changeMarker.prevAll('.views-operator-label');

          if (operatorLabel.length) {
            operatorLabel.insertAfter(changeMarker);
          }
        }

        const groupRow = $(this.rowObject.element).prevAll('tr.group-message').get(0);
        const groupName = groupRow.className.replace(/([^ ]+[ ]+)*group-([^ ]+)-message([ ]+[^ ]+)*/, '$2');
        const groupField = $('select.views-group-select', this.rowObject.element);

        if (!groupField.is(`.views-group-select-${groupName}`)) {
          const oldGroupName = groupField.attr('class').replace(/([^ ]+[ ]+)*views-group-select-([^ ]+)([ ]+[^ ]+)*/, '$2');
          groupField.removeClass(`views-group-select-${oldGroupName}`).addClass(`views-group-select-${groupName}`);
          groupField[0].value = groupName;
        }
      };
    },

    redrawOperatorLabels() {
      for (let i = 0; i < this.draggableRows.length; i++) {
        const $draggableRow = $(this.draggableRows[i]);
        const $firstCell = $draggableRow.find('td').eq(0);

        if ($firstCell.length) {
          const operatorValue = $draggableRow.prevAll('.views-group-title').find('option:selected').html();
          const operatorLabel = `<span class="views-operator-label">${operatorValue}</span>`;
          const $nextRow = $draggableRow.nextAll(':visible').eq(0);
          const $existingOperatorLabel = $firstCell.find('.views-operator-label');

          if ($nextRow.hasClass('draggable')) {
            if ($existingOperatorLabel.length) {
              $existingOperatorLabel.replaceWith(operatorLabel);
            } else {
              $firstCell.append(operatorLabel);
            }
          } else {
            $existingOperatorLabel.remove();
          }
        }
      }
    },

    updateRowspans() {
      let $row;
      let $currentEmptyRow;
      let draggableCount;
      let $operatorCell;
      const rows = $(this.table).find('tr');
      const length = rows.length;

      for (let i = 0; i < length; i++) {
        $row = $(rows[i]);

        if ($row.hasClass('views-group-title')) {
          $operatorCell = $row.find('td.group-operator');
          draggableCount = 0;
          $currentEmptyRow = $row.next('tr');
          $currentEmptyRow.removeClass('group-populated').addClass('group-empty');
          $operatorCell.attr('rowspan', 2);
        } else if ($row.hasClass('draggable') && $row.is(':visible')) {
          draggableCount++;
          $currentEmptyRow.removeClass('group-empty').addClass('group-populated');
          $operatorCell.attr('rowspan', draggableCount + 1);
        }
      }
    }

  });
  Drupal.behaviors.viewsFilterConfigSelectAll = {
    attach(context) {
      const selectAll = once('filterConfigSelectAll', '.js-form-item-options-value-all', context);

      if (selectAll.length) {
        const $selectAll = $(selectAll);
        const $selectAllCheckbox = $selectAll.find('input[type=checkbox]');
        const $checkboxes = $selectAll.closest('.form-checkboxes').find('.js-form-type-checkbox:not(.js-form-item-options-value-all) input[type="checkbox"]');
        $selectAll.show();
        $selectAllCheckbox.on('click', function () {
          $checkboxes.prop('checked', $(this).is(':checked'));
        });
        $checkboxes.on('click', function () {
          if ($(this).is('checked') === false) {
            $selectAllCheckbox.prop('checked', false);
          }
        });
      }
    }

  };
  Drupal.behaviors.viewsRemoveIconClass = {
    attach(context) {
      $(once('dropbutton-icon', '.dropbutton', context)).find('.icon').removeClass('icon');
    }

  };
  Drupal.behaviors.viewsUiCheckboxify = {
    attach(context, settings) {
      const buttons = once('views-ui-checkboxify', '[data-drupal-selector="edit-options-expose-button-button"], [data-drupal-selector="edit-options-group-button-button"]').forEach(button => new Drupal.viewsUi.Checkboxifier(button));
    }

  };
  Drupal.behaviors.viewsUiChangeDefaultWidget = {
    attach(context) {
      const $context = $(context);

      function changeDefaultWidget(event) {
        if ($(event.target).prop('checked')) {
          $context.find('input.default-radios').parent().hide();
          $context.find('td.any-default-radios-row').parent().hide();
          $context.find('input.default-checkboxes').parent().show();
        } else {
          $context.find('input.default-checkboxes').parent().hide();
          $context.find('td.any-default-radios-row').parent().show();
          $context.find('input.default-radios').parent().show();
        }
      }

      $context.find('input[name="options[group_info][multiple]"]').on('change', changeDefaultWidget).trigger('change');
    }

  };

  Drupal.viewsUi.Checkboxifier = function (button) {
    this.$button = $(button);
    this.$parent = this.$button.parent('div.views-expose, div.views-grouped');
    this.$input = this.$parent.find('input:checkbox, input:radio');
    this.$button.hide();
    this.$parent.find('.exposed-description, .grouped-description').hide();
    this.$input.on('click', $.proxy(this, 'clickHandler'));
  };

  Drupal.viewsUi.Checkboxifier.prototype.clickHandler = function (e) {
    this.$button.trigger('click').trigger('submit');
  };

  Drupal.behaviors.viewsUiOverrideSelect = {
    attach(context) {
      once('views-ui-override-button-text', '[data-drupal-selector="edit-override-dropdown"]', context).forEach(dropdown => {
        const $context = $(context);
        const submit = context.querySelector('[id^=edit-submit]');
        const oldValue = submit ? submit.value : '';
        $(once('views-ui-override-button-text', submit)).on('mouseup', function () {
          this.value = oldValue;
          return true;
        });
        $(dropdown).on('change', function () {
          if (!submit) {
            return;
          }

          if (this.value === 'default') {
            submit.value = Drupal.t('Apply (all displays)');
          } else if (this.value === 'default_revert') {
            submit.value = Drupal.t('Revert to default');
          } else {
            submit.value = Drupal.t('Apply (this display)');
          }

          const $dialog = $context.closest('.ui-dialog-content');
          $dialog.trigger('dialogButtonsChange');
        }).trigger('change');
      });
    }

  };
  Drupal.behaviors.viewsUiHandlerRemoveLink = {
    attach(context) {
      const $context = $(context);
      $(once('views', 'a.views-remove-link', context)).on('click', function (event) {
        const id = $(this).attr('id').replace('views-remove-link-', '');
        $context.find(`#views-row-${id}`).hide();
        $context.find(`#views-removed-${id}`).prop('checked', true);
        event.preventDefault();
      });
      $(once('display', 'a.display-remove-link', context)).on('click', function (event) {
        const id = $(this).attr('id').replace('display-remove-link-', '');
        $context.find(`#display-row-${id}`).hide();
        $context.find(`#display-removed-${id}`).prop('checked', true);
        event.preventDefault();
      });
    }

  };
  Drupal.behaviors.viewsUiRearrangeFilter = {
    attach(context) {
      if (typeof Drupal.tableDrag === 'undefined' || typeof Drupal.tableDrag['views-rearrange-filters'] === 'undefined') {
        return;
      }

      const table = once('views-rearrange-filters', '#views-rearrange-filters', context);
      const operator = once('views-rearrange-filters', '.js-form-item-filter-groups-operator', context);

      if (table.length) {
        new Drupal.viewsUi.RearrangeFilterHandler($(table), $(operator));
      }
    }

  };
})(jQuery, Drupal, drupalSettings);