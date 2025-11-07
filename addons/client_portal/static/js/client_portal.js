/**
 * Client Portal - ISEB
 * JavaScript pour graphiques interactifs, upload drag & drop, et capture photo
 */

odoo.define('client_portal.dashboard', function (require) {
    'use strict';

    var publicWidget = require('web.public.widget');
    var core = require('web.core');
    var _t = core._t;

    // Widget Dashboard avec graphiques Chart.js
    publicWidget.registry.ClientDashboard = publicWidget.Widget.extend({
        selector: '.o_client_dashboard',
        
        start: function () {
            this._super.apply(this, arguments);
            this._initCharts();
            return this._super.apply(this, arguments);
        },

        _initCharts: function () {
            // Graphique évolution CA sur 12 mois
            var revenueCtx = document.getElementById('revenueChart');
            if (revenueCtx) {
                var revenueData = JSON.parse(revenueCtx.dataset.chartData || '{}');
                new Chart(revenueCtx, {
                    type: 'line',
                    data: {
                        labels: revenueData.labels || [],
                        datasets: [{
                            label: 'Chiffre d\'affaires',
                            data: revenueData.values || [],
                            borderColor: '#28a745',
                            backgroundColor: 'rgba(40, 167, 69, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top'
                            },
                            tooltip: {
                                mode: 'index',
                                intersect: false,
                                callbacks: {
                                    label: function(context) {
                                        return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + ' €';
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return value.toFixed(0) + ' €';
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // Graphique comparaison CA vs Charges
            var comparisonCtx = document.getElementById('comparisonChart');
            if (comparisonCtx) {
                var comparisonData = JSON.parse(comparisonCtx.dataset.chartData || '{}');
                new Chart(comparisonCtx, {
                    type: 'bar',
                    data: {
                        labels: comparisonData.labels || [],
                        datasets: [
                            {
                                label: 'Chiffre d\'affaires',
                                data: comparisonData.revenue || [],
                                backgroundColor: '#28a745'
                            },
                            {
                                label: 'Charges',
                                data: comparisonData.expenses || [],
                                backgroundColor: '#ffc107'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return value.toFixed(0) + ' €';
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // Graphique répartition dépenses (Pie chart)
            var expensesCtx = document.getElementById('expensesChart');
            if (expensesCtx) {
                var expensesData = JSON.parse(expensesCtx.dataset.chartData || '{}');
                new Chart(expensesCtx, {
                    type: 'doughnut',
                    data: {
                        labels: expensesData.labels || [],
                        datasets: [{
                            data: expensesData.values || [],
                            backgroundColor: [
                                '#007bff',
                                '#28a745',
                                '#ffc107',
                                '#dc3545',
                                '#6c757d',
                                '#17a2b8'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'right'
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        var label = context.label || '';
                                        var value = context.parsed;
                                        var total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        var percentage = ((value / total) * 100).toFixed(1);
                                        return label + ': ' + value.toFixed(2) + ' € (' + percentage + '%)';
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
    });

    // Widget Upload avec Drag & Drop
    publicWidget.registry.DocumentUpload = publicWidget.Widget.extend({
        selector: '.o_document_upload',
        events: {
            'dragover .upload-zone': '_onDragOver',
            'dragleave .upload-zone': '_onDragLeave',
            'drop .upload-zone': '_onDrop',
            'change input[type="file"]': '_onFileChange',
            'click .upload-zone': '_onClickUploadZone'
        },

        start: function () {
            this._super.apply(this, arguments);
            this.$uploadZone = this.$('.upload-zone');
            this.$fileInput = this.$('input[type="file"]');
            this.$preview = this.$('.upload-preview');
        },

        _onDragOver: function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            this.$uploadZone.addClass('dragging');
        },

        _onDragLeave: function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            this.$uploadZone.removeClass('dragging');
        },

        _onDrop: function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            this.$uploadZone.removeClass('dragging');
            
            var files = ev.originalEvent.dataTransfer.files;
            if (files.length > 0) {
                this._handleFiles(files);
            }
        },

        _onClickUploadZone: function (ev) {
            if (ev.target.tagName !== 'INPUT') {
                this.$fileInput.click();
            }
        },

        _onFileChange: function (ev) {
            var files = ev.target.files;
            if (files.length > 0) {
                this._handleFiles(files);
            }
        },

        _handleFiles: function (files) {
            var self = this;
            Array.from(files).forEach(function (file) {
                self._previewFile(file);
                self._uploadFile(file);
            });
        },

        _previewFile: function (file) {
            var self = this;
            var reader = new FileReader();
            
            reader.onload = function (e) {
                var preview = $('<div class="file-preview">');
                
                if (file.type.startsWith('image/')) {
                    preview.append($('<img>').attr('src', e.target.result));
                } else {
                    preview.append($('<i class="fa fa-file fa-3x">'));
                }
                
                preview.append($('<p>').text(file.name));
                preview.append($('<small>').text(self._formatFileSize(file.size)));
                
                self.$preview.append(preview);
            };
            
            reader.readAsDataURL(file);
        },

        _uploadFile: function (file) {
            var self = this;
            var formData = new FormData();
            formData.append('file', file);
            formData.append('csrf_token', odoo.csrf_token);
            
            // Barre de progression
            var $progress = $('<div class="upload-progress"><div class="progress-bar"></div></div>');
            this.$preview.append($progress);
            
            $.ajax({
                url: '/my/document/upload',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                xhr: function () {
                    var xhr = new window.XMLHttpRequest();
                    xhr.upload.addEventListener('progress', function (e) {
                        if (e.lengthComputable) {
                            var percent = (e.loaded / e.total) * 100;
                            $progress.find('.progress-bar').css('width', percent + '%');
                        }
                    }, false);
                    return xhr;
                },
                success: function (data) {
                    $progress.remove();
                    self._showSuccess(_t('Fichier uploadé avec succès'));
                    setTimeout(function () {
                        window.location.reload();
                    }, 1000);
                },
                error: function () {
                    $progress.remove();
                    self._showError(_t('Erreur lors de l\'upload'));
                }
            });
        },

        _formatFileSize: function (bytes) {
            if (bytes === 0) return '0 Bytes';
            var k = 1024;
            var sizes = ['Bytes', 'KB', 'MB', 'GB'];
            var i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        },

        _showSuccess: function (message) {
            this._showNotification(message, 'success');
        },

        _showError: function (message) {
            this._showNotification(message, 'danger');
        },

        _showNotification: function (message, type) {
            var $alert = $('<div class="alert alert-' + type + ' alert-dismissible fade show">')
                .text(message)
                .append('<button type="button" class="close" data-dismiss="alert">&times;</button>');
            this.$el.prepend($alert);
            setTimeout(function () {
                $alert.alert('close');
            }, 3000);
        }
    });

    // Widget Capture Photo (Mobile)
    publicWidget.registry.PhotoCapture = publicWidget.Widget.extend({
        selector: '.o_photo_capture',
        events: {
            'click .btn-capture-photo': '_onCapturePhoto',
            'change input[type="file"][accept="image/*"]': '_onPhotoSelected'
        },

        _onCapturePhoto: function (ev) {
            ev.preventDefault();
            // Sur mobile, le input file avec capture="camera" ouvre directement l'appareil photo
            this.$('input[type="file"][accept="image/*"]').click();
        },

        _onPhotoSelected: function (ev) {
            var file = ev.target.files[0];
            if (file) {
                this._processPhoto(file);
            }
        },

        _processPhoto: function (file) {
            var self = this;
            var reader = new FileReader();
            
            reader.onload = function (e) {
                // Afficher l'aperçu
                self.$('.photo-preview img').attr('src', e.target.result).show();
                
                // Optionnel: Appeler OCR si disponible
                if (typeof self._performOCR === 'function') {
                    self._performOCR(e.target.result);
                }
            };
            
            reader.readAsDataURL(file);
        },

        _performOCR: function (imageData) {
            var self = this;

            // Afficher un loader
            var $loader = $('<div class="ocr-loader">').html(
                '<i class="fa fa-spinner fa-spin"></i> Analyse en cours...'
            );
            self.$('.photo-capture-zone').append($loader);

            // Appeler le backend pour OCR (auto-sélection DeepSeek ou Tesseract)
            $.ajax({
                url: '/my/expense/ocr',
                type: 'POST',
                data: JSON.stringify({
                    image: imageData,
                    backend: 'auto',  // Sélection automatique du meilleur backend
                    csrf_token: odoo.csrf_token
                }),
                contentType: 'application/json',
                success: function (data) {
                    $loader.remove();

                    if (data.success) {
                        // Pré-remplir les champs avec les données OCR
                        $('input[name="amount"]').val(data.amount);
                        $('input[name="expense_date"]').val(data.date);
                        $('input[name="vendor"]').val(data.vendor);

                        // Afficher un message de succès avec le backend utilisé
                        var backendName = data.backend === 'deepseek' ? 'DeepSeek-OCR (IA)' : 'Tesseract';
                        var confidence = Math.round(data.confidence * 100);

                        var $success = $('<div class="alert alert-success alert-dismissible fade show mt-2">').html(
                            '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
                            '<i class="fa fa-check-circle"></i> ' +
                            '<strong>Données extraites avec succès!</strong><br/>' +
                            '<small>Backend: ' + backendName + ' | Confiance: ' + confidence + '%</small>'
                        );

                        self.$('.photo-capture-zone').append($success);

                        // Auto-fermer après 5 secondes
                        setTimeout(function() {
                            $success.fadeOut(function() { $(this).remove(); });
                        }, 5000);
                    } else {
                        // Erreur OCR
                        var $error = $('<div class="alert alert-warning alert-dismissible fade show mt-2">').html(
                            '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
                            '<i class="fa fa-exclamation-triangle"></i> ' +
                            'Impossible d\'extraire les données automatiquement. Veuillez les saisir manuellement.'
                        );
                        self.$('.photo-capture-zone').append($error);
                    }
                },
                error: function () {
                    $loader.remove();
                    console.log('OCR non disponible');

                    var $error = $('<div class="alert alert-info alert-dismissible fade show mt-2">').html(
                        '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
                        '<i class="fa fa-info-circle"></i> Service OCR indisponible.'
                    );
                    self.$('.photo-capture-zone').append($error);
                }
            });
        }
    });

    // Widget Export PDF/Excel
    publicWidget.registry.DataExport = publicWidget.Widget.extend({
        selector: '.o_data_export',
        events: {
            'click .btn-export-pdf': '_onExportPDF',
            'click .btn-export-excel': '_onExportExcel'
        },

        _onExportPDF: function (ev) {
            ev.preventDefault();
            var url = $(ev.currentTarget).data('url');
            window.location.href = url + '?format=pdf';
        },

        _onExportExcel: function (ev) {
            ev.preventDefault();
            var url = $(ev.currentTarget).data('url');
            window.location.href = url + '?format=excel';
        }
    });

    return {
        ClientDashboard: publicWidget.registry.ClientDashboard,
        DocumentUpload: publicWidget.registry.DocumentUpload,
        PhotoCapture: publicWidget.registry.PhotoCapture,
        DataExport: publicWidget.registry.DataExport
    };
});
