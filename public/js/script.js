(function () {
    Vue.component("modal-popup", {
        template: "#template", // THIS must be the id of the new vue component script in the html file
        props: ["imageId"], //// PROPS are passing information from parent "data" object to child (see also the pop-up element in the html file)
        data: function () {
            return {
                title: "",
                description: "",
                username: "",
                url: "",
                comments: [],
                commentField: "",
                commentUsername: "",
                prevId: "",
                nextId: "",
                id: "",
                image: "",
            };
        },

        mounted: function () {
            var self = this;
            self.username = "";
            self.comment = "";
            self.buildModal();
        },

        methods: {
            buildModal: function () {
                var self = this;
                if (self.imageId == 0) {
                    self.closeModal();
                }
                location.hash = self.imageId;
                axios
                    .get(`/modal/${location.hash.slice(1)}`) // using a dynamic url because, while it is still a get request, we still need to send some information
                    .then(function (serverResponse) {
                        var results = serverResponse.data[0].rows[0];
                        var commentResult = serverResponse.data[1].rows;
                        var idArray = serverResponse.data[2].rows;
                        console.log("results: ", results);

                        self.description = results.description;
                        self.username = results.username;
                        self.title = results.title;
                        self.url = results.url;
                        self.comments = commentResult;

                        if (idArray.length === 2) {
                            self.prevId = idArray[0].id;
                            self.nextId = idArray[1].id;
                            console.log(
                                "prev/next id: ",
                                self.prevId,
                                self.nextId
                            );
                        }
                        if (idArray.length === 1) {
                            if (idArray[0].id < self.imageId) {
                                self.prevId = idArray[0].id;
                                // self.nextId = "";
                            } else {
                                self.nextId = idArray[0].id;
                                // self.prevId = "";
                            }
                        }
                    })
                    .catch(function (err) {
                        console.log("err in getting img", err);
                    });
                self.username = "";
                self.comment = "";
            },

            previousImage: function () {
                var self = this;
                location.hash = self.prevId;
                this.$emit("update");
            },
            nextImage: function () {
                var self = this;
                location.hash = self.nextId;
                this.$emit("update");
            },

            closeModal: function () {
                history.replaceState(null, null, " ");
                this.$emit("close");
            },
            deleteComment: function (id) {
                var commentId = id;
                console.log("deleteCommentID", commentId);

                // adda common class to all the buttons
                let deleteBtn = document.getElementsByClassName("comment-row");
                // converting html collection to array, to use array methods
                Array.prototype.slice.call(deleteBtn).forEach(function (item) {
                    // iterate and add the event handler to it
                    item.addEventListener("click", function (e) {
                        e.target.parentNode.remove();
                    });
                });
                this.$emit("remove", commentId);
            },
            deleteImage: function () {
                var self = this;
                location.hash = self.imageId;

                // self.$emit("delete", imageId);
                console.log("About to delete all img datas ");
                axios
                    .get(`/delete/${location.hash.slice(1)}`)
                    .then(function (res) {
                        console.log("res.data", res.data);

                        self.closeMe();
                    })
                    .catch(function (e) {
                        console.log("err in deleteAll", e);
                    });
                this.updateModal();
            },

            submitComment: function (e) {
                e.preventDefault();
                var self = this;
                var obj = {
                    imageId: self.imageId,
                    commentUsername: self.commentUsername,
                    comment: self.commentField,
                };

                console.log("obj", obj);
                this.commentUsername = "";
                this.comment = "";

                axios
                    .post("/modal/" + self.imageId, obj)
                    .then(function (res) {
                        console.log("self.comment", self.comment);
                        // self.comment.unshift(res.data[0]);
                        self.updateModal();
                    })
                    .catch(function (e) {
                        console.log("err in POST /modal: ", e);
                    });
                self.username = "";
                self.commentField = "";
            },
            updateModal: function () {
                var self = this;
                console.log("location.hash", location.hash);
                if (self.imageId) {
                    axios
                        .get(`/modal/${location.hash.slice(1)}`) // using a dynamic url because, while it is still a get request, we still need to send some information
                        .then(function (serverResponse) {
                            var results = serverResponse.data[0].rows[0];
                            var commentResult = serverResponse.data[1].rows;
                            var idArray = serverResponse.data[2].rows;
                            console.log("results/updateModal: ", results);

                            if (idArray.length === 2) {
                                self.prevId = idArray[0].id;
                                self.nextId = idArray[1].id;
                                console.log(
                                    "prev/next id: ",
                                    self.prevId,
                                    self.nextId
                                );
                            } else if (idArray.length === 1) {
                                if (idArray[0].id < self.imageId) {
                                    self.prevId = idArray[0].id;
                                    console.log("prevId", self.prevId);
                                } else {
                                    self.nextId = idArray[0].id;
                                    console.log("nextId", self.nextId);
                                }
                            } else {
                                console.log("No other images");
                            }
                            self.description = results.description;
                            self.username = results.username;
                            self.title = results.title;
                            self.url = results.url;
                            self.comments = commentResult;
                        })
                        .catch(function (e) {
                            console.log("e: ", e);
                            self.closeModal();
                        });
                } else {
                    this.closeModal();
                }
            },
        },
    });

    Vue.config.ignoredElements = [/^ion-/];

    new Vue({
        el: "#main",
        data: {
            images: [],
            // added new data properties for the input / file fields
            title: "",
            description: "",
            username: "",
            file: null,
            imageId: location.hash.slice(1),
            imageCount: "",
        },

        ///// IMPORTANT /////
        // the mounted function is the perfect time and place
        // where we can ask the database if there are any images or other data to retrieve

        mounted: function () {
            var self = this;

            //make Modal open
            addEventListener("hashchange", function () {
                self.imageId = location.hash.slice(1);
            });
            // check scroll
            document.addEventListener("scroll", this.handleScroll);

            // get images
            self.getImages();
        },
        // watch: {
        //     imageId: function () {
        //         var self = this;
        //         self.getImages();
        //     },
        // },

        methods: {
            getImages: function () {
                var self = this;

                axios
                    .get("/images")
                    .then(function (res) {
                        self.images = res.data[0].rows;
                        // self.imageCount = res.data[1].rows[0].count;
                    })
                    .catch(function (err) {
                        console.log("err in /images: ", err);
                    });
            },
            handleClick: function (e) {
                // prevents the page from reloading
                e.preventDefault();
                // 'this' allows me to see all the properties of data
                console.log("this! ", this);

                // we NEED to use FormData ONLY when we send a file to the server
                var formData = new FormData();
                formData.append("title", this.title);
                formData.append("description", this.description);
                formData.append("username", this.username);
                formData.append("file", this.file);

                var self = this;

                this.title = "";
                this.description = "";
                this.username = "";

                axios
                    .post("/upload", formData)
                    .then(function (res) {
                        console.log("resp from POST /uplaod: ", res.data);
                        self.images.unshift(res.data);
                    })
                    .catch(function (err) {
                        console.log("err in POST /upload: ", err);
                    });
            },

            handleChange: function (e) {
                //this happens when somebody selects a file
                console.log("file: ", e.target.files[0]);
                this.file = e.target.files[0];
            },

            handleScroll: function () {
                var self = this;
                setTimeout(function () {
                    // console.log("window height: ", window.innerHeight);
                    // console.log(
                    //     "document height: ",
                    //     document.documentElement.offsetHeight
                    // );
                    // console.log(
                    //     "document scroll top: ",
                    //     document.documentElement.scrollTop
                    // );

                    if (
                        window.innerHeight +
                            document.documentElement.scrollTop >
                        document.documentElement.offsetHeight - 10
                    ) {
                        /* adjust the condition to see if the user is 100px to the bottom, probably use <   */
                        // if user is close to botton
                        // make ajax request, no difference from the next button request
                        console.log("at the bottom!");
                        self.getMoreImages();
                    } else {
                        // if user is not close to bottom
                        self.handleScroll(); // let's check again, and again and again
                    }
                }, 3000);
            },
            getMoreImages: function () {
                var self = this;
                console.log("self: ", self);
                console.log("getting more images!");
                var lastId = self.images.slice(-1)[0].id;
                axios
                    .get(`/extrascroll/${lastId}`)
                    .then(function (resp) {
                        console.log("response from /images", resp); // resp.data is where the response coming from the server (index.js) is coming
                        console.log("this inside axios: ", self);
                        console.log("resp.data EXTRASCROLL: ", resp.data);

                        for (var obj of resp.data) {
                            self.images.push(obj);
                        }
                        self.handleScroll;
                    })
                    .catch(function (err) {
                        console.log("err in /images", err);
                    });
            },

            closeMe: function () {
                this.imageId = null;
            },

            changeModal: function () {
                this.$refs.popup.updateModal();
            },

            removeComment: function (id) {
                var self = this;
                console.log("from removeComment", id);
                axios
                    .post("/remove/" + id)
                    .then(function () {
                        self.$refs.popup.updateModal();
                    })
                    .catch(function (e) {
                        console.log("error in deleting comment: ", e);
                        self.closeMe();
                    });
            },
            deleteAll: function (imageId) {
                var self = this;
                console.log("About to delete all img datas ");
                axios
                    .get("/delete/", imageId)
                    .then(function (res) {
                        self.closeMe();
                    })
                    .catch(function (e) {
                        console.log("err in deleteAll", e);
                    });
            },
        },
    });
})();
