var app = angular.module('demoApp', ['ngRoute']);
app.config(function($routeProvider, $locationProvider) {
  $routeProvider
    .when('/demoApp', {
      templateUrl: 'login.html',
      controller: 'MainCtrl'
    })
    .when('/demoApp/emp/:empId', {
      templateUrl: 'editEmp.html',
      controller: 'EditCtrl'
    })
    .when('/demoApp/:userName', {
      templateUrl: 'mainPage.html',
      controller: 'MainPageCtrl',
      resolve: {
        // I will cause a 1 second delay d
        delay: function($q, $timeout) {
          var delay = $q.defer();
          $timeout(delay.resolve, 3000);
          return delay.promise;
        }
      }
    })
    .otherwise({
      redirectTo: '/demoApp'
    });
  // configure html5 to get links working on jsfiddle
  $locationProvider.html5Mode(true);
});


//========================== Directives =====================================
app.directive("infinteScroll", function() {
  return function(scope, element, attr) {
    var raw = element[0];
    element.bind('scroll', function() {
      //debugger;
      // console.log(raw, element, attr);
      if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
        scope.$apply(attr.infinteScroll);
      }
    });
  }
});

//==========================  Controllers  =========================================

app.controller('MainCtrl', function($scope, $location, $cacheFactory) {
  $scope.isLoading = false;
  $scope.hasError = false;
  if (angular.isDefined($scope.cache)) {
    $scope.cache.destroy();
  }
  $scope.cache = $cacheFactory('loginCache');
  $scope.loginClick = function(e, scope) {
    var target = e.target;
    if (!(scope.userName && scope.userPass)) {
      scope.hasError = true;
      return;
    }
    target.style.display = 'none';
    scope.isLoading = true;
    scope.cache.put('userName', scope.userName);
    $location.path('/demoApp/' + scope.userName);

  };
});

app.controller('MainPageCtrl', function($scope, $location, $routeParams, empDetail, $timeout) {
  $scope.userName = $routeParams.userName;
  $scope.employees = [];
  $scope.isLoading = false;
  $scope.totalCount = 105;
  var count = 0;
  debugger;
  empDetail.getEmp().then(function(records) {
    empDetail.saveEmp(records);
    $scope.employees = empDetail.getList();
    count = $scope.employees.length;
  });
  $scope.loadMoreData = function() {
    if ($scope.employees.length === $scope.totalCount) {
      $scope.isLoading = false;
      return;
    }

    $scope.isLoading = true;
    $timeout(function() {
      for (var i = 0; i < 10; i++) {
        $scope.isLoading = false;
        if ($scope.employees.length === $scope.totalCount) {
          break;
        }
        $scope.employees.push({
          empId: ++count,
          empName: 'EmpName' + count,
          bloodGrp: 'Blood' + count,
          managerName: 'ManagerName' + count
        });

      }
    }, 1500);

  }
});

app.controller('EditCtrl', function($scope, $route, $routeParams, $location, empDetail, $cacheFactory) {
  $scope.$route = $route;
  $scope.$routeParams = $routeParams;
  $scope.$location = $location;
  $scope.isUpdating = false;
  debugger;
  var empId = Number($routeParams.empId);
  var empRecs = empDetail.getList();
  var empRec;
  var cacheData = $cacheFactory.get('loginCache');
  angular.forEach(empRecs, function(rec, key) {
    if (Number(rec.empId) === empId) {
      empRec = rec;
      //return false;
    }
  });
  
  if (empRec) {
    $scope.formData = {
      empId: empRec.empId,
      empName: empRec.empName,
      bloodGrp: empRec.bloodGrp,
      managerName: empRec.managerName
    }
  }
  $scope.saveBtn = function(e) {
    e.target.style.display = 'none';
    $scope.isUpdating = true;
    $location.path('/demoApp/' + cacheData.get('userName'));
  }
});

app.service("empDetail", function($q, $http) {
  this.empRecords = [];

  this.getEmp = getEmp;
  this.saveEmp = saveEmp;
  this.getList = getList;

  function getList() {
    return this.empRecords;
  }

  function saveEmp(recs) {
    this.empRecords = recs;
  }

  function getEmp() {
    var request = $http({
      method: "get",
      url: "emp.json",
      params: {
        action: "get"
      }
    });
    return (request.then(handleSuccess, handleError));
  }

  function handleError(response) {
    // The API response from the server should be returned in a
    // nomralized format. However, if the request was not handled by the
    // server (or what not handles properly - ex. server error), then we
    // may have to normalize it on our end, as best we can.
    if (!angular.isArray(response.data.records)) {
      return ($q.reject("An unknown error occurred."));
    }
    // Otherwise, use expected error message.
    return ($q.reject("Error! while retriving data"));
  }
  // I transform the successful response, unwrapping the application data
  // from the API response payload.
  function handleSuccess(response) {
    this.empRecords = response.data.records;
    return (this.empRecords);
  }
});
