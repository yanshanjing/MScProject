/*jshint strict: false */

var viewModel = function() {
    var self = this;
    var PAGE_SIZE = 10;

    self.status = ko.observable();
    self.graph = ko.observable();
    self.cy = ko.observable();
    self.community = ko.observableArray();

    // COMMUNITY TABLE -----
    self.tableHeadings = ko.observableArray();

    self.computeTableHeadings = ko.computed(function() {
        var headings = [];
        if (self.community().length > 0 && self.community()[0].data.metadata) {
            var metadata = self.community()[0].data.metadata;
            for (var key in metadata) {
                if (key != 'community') {
                    headings.push(key);
                }
            }
        }
        self.tableHeadings(headings);
    });

    self.communityPageIndex = ko.observable(1);

    self.communityNoOfPages = ko.computed( function() {
        self.communityPageIndex(1);
        return Math.floor((self.community().length - 1) / PAGE_SIZE) + 1;
    });

    self.isFirstPage = ko.computed( function() {
        return self.communityPageIndex() === 1;
    });

    self.isLastPage = ko.computed( function() {
        return self.communityPageIndex() === self.communityNoOfPages();
    });

    this.pagedCommunity = ko.computed(function() {
        var startIndex = (self.communityPageIndex()-1) * PAGE_SIZE;
        var endIndex = startIndex + PAGE_SIZE;
        var page = self.community().slice(startIndex, endIndex);
        page.forEach( function (node) {
            delete node.data.metadata.community;
        });
        return page;
    });

    self.nextPage = function() {
        self.communityPageIndex(self.communityPageIndex() + 1);
    };

    self.previousPage = function() {
        self.communityPageIndex(self.communityPageIndex() - 1);
    };

    self.firstPage = function() {
        self.communityPageIndex(1);
    };

    self.lastPage = function() {
        self.communityPageIndex(self.communityNoOfPages());
    };

    // RESULTS -----
    self.allModularities = ko.computed( function() {
        return self.graph() ? self.graph().modularities : '';
    });

    self.metadata = ko.computed( function() {
        return self.graph() ? self.graph().metadata : '';
    });

    self.modularity = ko.computed(function() {
        return self.graph() ? self.metadata().modularity.toFixed(2) : '';
    });

    self.minCommunitySize = ko.computed(function() {
        return self.metadata().minCommunitySize;
    });

    self.maxCommunitySize = ko.computed(function() {
        return self.metadata().maxCommunitySize;
    });

    self.avgCommunitySize = ko.computed(function() {
        return self.metadata().avgCommunitySize;
    });

    self.maxEdgeConnection = ko.computed(function() {
        return self.metadata().maxEdgeConnection;
    });

    self.hierarchyHeight = ko.computed(function() {
        return self.metadata().hierarchyHeight;
    });

    self.currentLevel = ko.computed(function() {
        return self.metadata().currentLevel;
    });

    self.isBottomLevel = ko.computed(function() {
        return self.currentLevel() === 0;
    });

    self.selectedCommunity = ko.observable();

    self.hasSelectedCommunity = ko.computed(function() {
        return self.selectedCommunity() && self.selectedCommunity() !== -1;
    });

    self.updateSelectedCommunity = function() {
        if (self.cy()) {
            if (self.cy().$('node:selected').length === 1) {
                self.selectedCommunity(cy.$('node:selected')[0].id());
            } else {
                self.selectedCommunity(-1);
            }
        }
    };

     self.levelsListWithModularity = ko.computed(function() {
        var levels = [];
        for (var i = 0; i <= self.hierarchyHeight(); i++) {
            var iModularity = (i === 0) ? 0 : self.allModularities()[(i-1)];
            if (iModularity || iModularity === 0 ) {
                levels.push(i + ' (' + iModularity.toFixed(2) + ')');
            }
        }
        return levels;
    });

    self.drillLevel = ko.observable();

    self.drillLevelIndex = ko.computed( function() {
        return self.levelsListWithModularity().indexOf(self.drillLevel());
    });

    self.availableLevels = ko.computed(function() {
        if (self.hasSelectedCommunity()) {
            self.drillLevel(self.currentLevel() - 1);
            return self.levelsListWithModularity().slice(0, self.currentLevel());
        } else {
            self.drillLevel(self.hierarchyHeight());
            return self.levelsListWithModularity().slice(0, self.hierarchyHeight() + 1);
        }
    });

    self.colourLevel = ko.observable();

    self.colourLevelIndex = ko.computed( function() {
        return self.levelsListWithModularity().indexOf(self.colourLevel());
    });

    self.colourLevels = ko.computed(function() {
        self.colourLevel(self.hierarchyHeight() + 1);
        var from = Math.max(self.drillLevelIndex(), 1);
        return self.levelsListWithModularity().slice(from, self.hierarchyHeight() + 1);
    });

    self.isSmallEnoughToView = ko.observable(false);

    self.computeSmallEnoughToView = ko.computed(function() {
        if (self.drillLevelIndex() === self.hierarchyHeight()) {
            self.isSmallEnoughToView(true);
        } else if (self.hasSelectedCommunity()) {
            if (!self.isBottomLevel() && self.selectedCommunity()) {
                var formData = 'graphLevel=' + encodeURIComponent(self.drillLevelIndex());
                formData += '&currentLevel=' + encodeURIComponent(self.currentLevel());
                formData += '&selectedNode=' + encodeURIComponent(self.selectedCommunity());
                $.ajax({
                  type: 'GET',
                  url: 'GetCommunitySize',
                  data: formData,
                  cache: false,
                  success: function(data){
                    if (data < 200) {
                        self.isSmallEnoughToView(true);
                    } else {
                        self.isSmallEnoughToView(false);
                    }
                  }
                });
            }
        } else if (self.drillLevel() || self.drillLevel() === 0) {
            $.ajax({
              type: 'GET',
              url: 'GetLevelSize',
              data: 'graphLevel=' + encodeURIComponent(self.drillLevelIndex()),
              cache: false,
              success: function(data){
                if (data < 1000) {
                    self.isSmallEnoughToView(true);
                } else {
                    self.isSmallEnoughToView(false);
                }
              }
            });
        } else {
            self.isSmallEnoughToView(false);
        }
    });

    // NODE LABELS -----
    self.hasLabels = ko.observable(false);

    self.resetHasLabels = ko.computed(function() {
        if (self.graph()) {
            self.hasLabels(false);
        }
    });

    self.nodeDataChoice = ko.observable();

    self.availableNodeData = ko.computed(function() {
        var options = [];
        if (self.graph()) {
            var metadata = self.graph().nodes[0].data.metadata;
            for (var key in metadata) {
               options.push(key);
            }
        }
        return options;
    });

    self.labelButton = ko.computed(function() {
        return self.hasLabels() ? 'Hide node labels' : 'Show node labels';
    });

    self.updateLabels = ko.computed(function() {
         if (self.hasLabels()) {
            self.cy().style().selector('node').css('content', 'data(metadata.' + self.nodeDataChoice() + ')').update();
        }
    });

    self.toggleLabels = function() {
        if (self.hasLabels()) {
            self.cy().style().selector('node').css('content', '').update();
            self.hasLabels(false);
        } else {
            self.cy().style().selector('node').css('content', 'data(metadata.' + self.nodeDataChoice() + ')').update();
            self.hasLabels(true);
        }
    };

     self.refreshLabels = function() {
        if (self.hasLabels()) {
            self.cy().style().selector('node').css('content', 'data(metadata.' + self.nodeDataChoice() + ')').update();
        }
    };

    // DISPLAY OPTIONS -----
    self.layoutOptions = ['Force-directed', 'Grid', 'Breadth-first', 'Circle'];

    self.layoutChoice = ko.observable('Force-directed');

    self.layoutTime = ko.observable(10);

    self.isArborRunning = ko.observable(false);

    self.cancelLayoutStatus = ko.observable(false);

    self.layoutChoiceComputed = ko.computed(function() {
        if (self.layoutChoice() === 'Force-directed') {
            self.cancelLayoutStatus(false);
            if (self.drillLevel() > 0) {
                return arborLayout(self.layoutTime());
            } else {
                return defaultArborLayout(self.layoutTime());
            }
        } else if (self.layoutChoice() === 'Grid') {
            return gridLayout();
        } else if (self.layoutChoice() === 'Breadth-first') {
            return breadthfirstLayout();
        } else {
            return circleLayout();
        }
    });

    self.usesArborLayout = ko.computed(function() {
        return self.layoutChoice() === 'Force-directed';
    });

    self.cancelLayout = function() {
        self.cancelLayoutStatus(true);
    };

    self.refreshLayout = function() {
        self.cy().layout(self.layoutChoiceComputed());
    };

    // UPLOAD -----
    self.fileValue = ko.observable();

    self.hasAddedFile = ko.observable(false);

    self.addedFile = function() {
        self.fileValue($('input[type=file]').val());
        if (self.fileValue()) {
            if ($("#fileInput")[0].files[0].size > 10000000) {
                alertify.alert('This file is too big. Files larger than 10mb currently not supported');
                self.hasAddedFile(false);
            } else {
                self.hasAddedFile(true);
            }
        } else {
            self.hasAddedFile(false);
        }
    };

    self.uploadGraph = function() {
        self.selectedCommunity(-1);
        var formData = new FormData($('form')[0]);
        graphRequest('ProcessGraph', formData, false, false, initialiseGraph);
    };

    self.updateGraph = function() {
        var formData = 'graphLevel=' + encodeURIComponent(self.drillLevelIndex());
        formData += '&colourLevel=' + encodeURIComponent(self.colourLevelIndex());
        if (self.hasSelectedCommunity()) {
            formData += '&currentLevel=' + encodeURIComponent(self.currentLevel());
            formData += '&selectedNode=' + encodeURIComponent(self.selectedCommunity());
        }
        var dataFunction = initialiseGraph;
        if (self.currentLevel() === self.drillLevelIndex()) {
            dataFunction = refreshColours;
            formData += '&includeEdges=' + encodeURIComponent('false');
        } else {
            formData += '&includeEdges=' + encodeURIComponent('true');
        }
        self.selectedCommunity(-1);
        graphRequest('UpdateGraph', formData, true, 'application/x-www-form-urlencoded', dataFunction);
    };

    self.downloadGraph = function() {
        var formData = 'graphLevel=' + encodeURIComponent(self.drillLevelIndex());
        formData += '&colourLevel=' + encodeURIComponent(self.colourLevelIndex());
        if (self.hasSelectedCommunity()) {
            formData += '&currentLevel=' + encodeURIComponent(self.currentLevel());
            formData += '&selectedNode=' + encodeURIComponent(self.selectedCommunity());
        }
        formData += '&includeEdges=' + encodeURIComponent('true');
        self.selectedCommunity(-1);
        window.location = 'DownloadGraph?' + formData;
    };

    self.updateCommunityTable = ko.computed(function() {
        if (self.hasSelectedCommunity()) {
            var formData = 'graphLevel=' + encodeURIComponent(0);
            formData += '&colourLevel=' + encodeURIComponent(self.hierarchyHeight());
            formData += '&currentLevel=' + encodeURIComponent(self.currentLevel());
            formData += '&selectedNode=' + encodeURIComponent(self.selectedCommunity());
            formData += '&includeEdges=' + encodeURIComponent('true');
            graphRequest('UpdateGraph', formData, true, 'application/x-www-form-urlencoded', setCommunity);
        } else {
            self.community([]);
        }
    });
};

viewModel = new viewModel();

ko.applyBindings(viewModel);

var graphRequest = function(url, formData, processData, contentType, dataFunction) {
    $.ajax({
        type: 'POST',
        url: url,
        data: formData,
        processData: processData,
        contentType: contentType,
        dataType: 'json',
        cache: false,

        success: function( data, textStatus, jqXHR) {
            if(data.success) {
                dataFunction(data);
            } else {
                alertify.alert('There was a problem: <br><br>' + data.error);
            }
        },

        beforeSend: function(jqXHR, settings) {
            $('#uploadButton').attr('disabled', true);
            alertify.success('Processing request...');
        },

        complete: function(jqXHR, textStatus){
            $('#uploadButton').attr('disabled', false);
        },

        error: function(jqXHR, textStatus, errorThrown){
            console.log('Something really bad happened ' + textStatus);
            alertify.error('POST ERROR', '', 0);
        }
    });
};

var initialiseGraph = function(data) {
    alertify.success('Processing complete');
    viewModel.graph(data);
    //console.log('in success: ' + JSON.stringify(data, undefined, 2));
    initCy(viewModel.graph());
};

var setCommunity = function(data) {
    viewModel.status('Processed');
    viewModel.community(data.nodes);
};

var refreshColours = function(data) {
    var nodes = data.nodes;
    nodes.forEach( function (node) {
        var id = node.data.id;
        var newColour = node.data.colour;
        var newMetadata = node.data.metadata;
        var cyNode = viewModel.cy().elements('node#' + id)[0];
        cyNode.data('colour', newColour);
        cyNode.data('metadata', newMetadata);
        cyNode.css('background-color', newColour);
    });
    viewModel.refreshLabels();
    alertify.success("Updated colours");
};