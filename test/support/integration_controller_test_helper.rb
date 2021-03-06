module IntegrationsControllerTestHelper
  def test_regular_commit(user_name, options, &block)
    describe "normal" do
      before(&block)

      it "triggers a deploy if there's a webhook mapping for the branch" do
        post :create, payload.merge(token: project.token)

        deploy = project.deploys.first
        deploy.commit.must_equal commit
      end

      it "doesn't trigger a deploy if there's no webhook mapping for the branch" do
        post :create, payload.merge(token: project.token).merge(options.fetch(:no_mapping))

        project.deploys.must_equal []
      end

      it "doesn't trigger a deploy if the build did not pass" do
        post :create, payload.merge(token: project.token).merge(options.fetch(:failed))

        project.deploys.must_equal []
      end

      it "deploys as the correct user" do
        post :create, payload.merge(token: project.token)

        user = project.deploys.first.user
        user.name.must_equal user_name
      end

      it "creates the ci user if it does not exist" do
        post :create, payload.merge(token: project.token)

        User.find_by_name(user_name).wont_be_nil
      end

      it "responds with 200 OK if the request is valid" do
        post :create, payload.merge(token: project.token)

        response.status.must_equal 200
      end

      it "responds with 422 OK if deploy cannot be started" do
        post :create, payload.merge(token: project.token)
        post :create, payload.merge(token: project.token)

        response.status.must_equal 422
      end

      it "responds with 404 Not Found if the token is invalid" do
        post :create, payload.merge(token: "foobar")

        response.status.must_equal 404
      end
    end
  end
end
