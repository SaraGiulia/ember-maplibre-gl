import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { clearRender, render } from '@ember/test-helpers';
import { Promise } from 'rsvp';
import setupMap from '../../helpers/create-map';
import { hbs } from 'ember-cli-htmlbars';
import Sinon from 'sinon';
import { all, defer as createDeferred } from 'rsvp';

module('Integration | Component | maplibre gl image', function (hooks) {
  setupMap(hooks);
  setupRenderingTest(hooks);

  hooks.before(function () {
    this.sandbox = Sinon.createSandbox();
  });

  hooks.afterEach(function () {
    this.sandbox.restore();
  });

  test('it ignores null image', async function (assert) {
    const loadImageSpy = this.sandbox.spy(this.map, 'loadImage');

    await render(hbs`{{maplibre-gl-image map=this.map}}`);

    assert.false(loadImageSpy.calledOnce, 'loadImage not called');
  });

  test('it adds the image to the map', async function (assert) {
    const loadImageSpy = this.sandbox.spy(this.map, 'loadImage');
    const addImageSpy = this.sandbox.spy(this.map, 'addImage');
    const removeImageSpy = this.sandbox.spy(this.map, 'removeImage');

    const defer = createDeferred();

    this.setProperties({
      name: 'logo',
      image: '/assets/maplibre-logo.png',
      options: {},
      onLoad: defer.resolve,
      onError: defer.reject,
    });

    await render(
      hbs`{{maplibre-gl-image this.name this.image this.options map=this.map onLoad=this.onLoad onError=this.onError}}`
    );

    assert.ok(loadImageSpy.calledOnce, 'loadImage called');
    assert.strictEqual(
      loadImageSpy.firstCall.args[0],
      this.image,
      'loads correct image'
    );

    await defer.promise;

    assert.ok(addImageSpy.calledOnce, 'addImage called');
    assert.strictEqual(
      addImageSpy.firstCall.args[0],
      this.name,
      'adds as correct name'
    );
    assert.strictEqual(
      addImageSpy.firstCall.args[2],
      this.options,
      'adds with correct options'
    );

    await clearRender();

    assert.ok(removeImageSpy.calledOnce, 'removeImage called');
    assert.strictEqual(
      removeImageSpy.firstCall.args[0],
      this.name,
      'removes correct name'
    );
  });

  test('it only adds the latest image if image is updated before the previous image finishes loading', async function (assert) {
    const loadImageSpy = this.sandbox.spy(this.map, 'loadImage');
    const addImageSpy = this.sandbox.spy(this.map, 'addImage');

    const defer = createDeferred();

    this.setProperties({
      name: 'logo',
      image: '/assets/creativecommons-128.png',
      options: {},
      onLoad: defer.resolve,
      onError: defer.reject,
    });

    await render(
      hbs`{{maplibre-gl-image this.name this.image this.options map=this.map onLoad=this.onLoad onError=this.onError}}`
    );

    assert.ok(loadImageSpy.calledOnce, 'loadImage called');
    assert.strictEqual(
      loadImageSpy.firstCall.args[0],
      this.image,
      'loads correct image'
    );

    this.set('image', '/assets/maplibre-logo.png');

    assert.ok(loadImageSpy.calledTwice, 'loadImage called');
    assert.strictEqual(
      loadImageSpy.secondCall.args[0],
      this.image,
      'loads correct image'
    );

    await defer.promise;

    assert.ok(addImageSpy.calledOnce, 'addImage called');
    assert.strictEqual(
      addImageSpy.firstCall.args[0],
      this.name,
      'adds as correct name'
    );
    assert.strictEqual(
      addImageSpy.firstCall.args[2],
      this.options,
      'adds with correct options'
    );
  });

  test("it doesn't load the image if the component is destroyed before the image has loaded", async function (assert) {
    // on the first call, store the args, and then after clearRender trigger the real call
    const loadImageStub = this.sandbox.stub(this.map, 'loadImage');
    let loadImageArgs = null;
    loadImageStub.onFirstCall().callsFake((...args) => {
      loadImageArgs = args;
    });
    loadImageStub.callThrough();

    const addImageSpy = this.sandbox.spy(this.map, 'addImage');

    this.setProperties({
      name: 'logo',
      image: '/assets/creativecommons-128.png',
    });

    await render(hbs`{{maplibre-gl-image this.name this.image map=this.map}}`);

    assert.ok(loadImageStub.calledOnce, 'loadImage called');
    assert.strictEqual(
      loadImageStub.firstCall.args[0],
      this.image,
      'loads correct image'
    );

    await clearRender();
    this.map.loadImage(...loadImageArgs);

    await new Promise((resolve) => setTimeout(resolve, 100));

    assert.notOk(addImageSpy.calledOnce, 'addImage not called');
  });

  test('it allows the image to be updated', async function (assert) {
    const loadImageSpy = this.sandbox.spy(this.map, 'loadImage');
    const addImageSpy = this.sandbox.spy(this.map, 'addImage');
    const removeImageSpy = this.sandbox.spy(this.map, 'removeImage');

    let defer = createDeferred();

    this.setProperties({
      name: 'logo',
      image: '/assets/maplibre-logo.png',
      options: {},
      onLoad: defer.resolve,
      onError: defer.reject,
    });

    await render(
      hbs`{{maplibre-gl-image this.name this.image this.options map=this.map onLoad=this.onLoad onError=this.onError}}`
    );

    assert.ok(loadImageSpy.calledOnce, 'loadImage called');
    assert.strictEqual(
      loadImageSpy.firstCall.args[0],
      this.image,
      'loads correct image'
    );

    await defer.promise;

    assert.ok(addImageSpy.calledOnce, 'addImage called');
    assert.strictEqual(
      addImageSpy.firstCall.args[0],
      this.name,
      'adds as correct name'
    );
    assert.strictEqual(
      addImageSpy.firstCall.args[2],
      this.options,
      'adds with correct options'
    );

    defer = createDeferred();

    this.setProperties({
      name: 'updated-logo',
      onLoad: defer.resolve,
      onError: defer.reject,
    });

    assert.ok(removeImageSpy.calledOnce, 'removeImage called');
    assert.strictEqual(
      removeImageSpy.firstCall.args[0],
      'logo',
      'removes old name'
    );

    assert.ok(loadImageSpy.calledTwice, 'loadImage called for updated image');
    assert.strictEqual(
      loadImageSpy.secondCall.args[0],
      this.image,
      'loads correct updated image'
    );

    await defer.promise;

    assert.ok(addImageSpy.calledTwice, 'addImage called for updated image');
    assert.strictEqual(
      addImageSpy.secondCall.args[0],
      this.name,
      'adds updated as correct name'
    );
    assert.strictEqual(
      addImageSpy.secondCall.args[2],
      this.options,
      'adds updated with correct options'
    );

    await clearRender();

    assert.ok(removeImageSpy.calledTwice, 'removeImage called for updated');
    assert.strictEqual(
      removeImageSpy.secondCall.args[0],
      this.name,
      'removes updated name'
    );
  });

  test('it allows options to not be passed', async function (assert) {
    const loadImageSpy = this.sandbox.spy(this.map, 'loadImage');
    const addImageSpy = this.sandbox.spy(this.map, 'addImage');

    const defer = createDeferred();

    this.setProperties({
      name: 'logo',
      image: '/assets/maplibre-logo.png',
      onLoad: defer.resolve,
      onError: defer.reject,
    });

    await render(
      hbs`{{maplibre-gl-image this.name this.image map=this.map onLoad=this.onLoad onError=this.onError}}`
    );

    assert.ok(loadImageSpy.calledOnce, 'loadImage called');
    assert.strictEqual(
      loadImageSpy.firstCall.args[0],
      this.image,
      'loads correct image'
    );

    await defer.promise;

    assert.ok(addImageSpy.calledOnce, 'addImage called');
    assert.strictEqual(
      addImageSpy.firstCall.args[0],
      this.name,
      'adds as correct name'
    );
  });

  test('it allows svgs to be added', async function (assert) {
    const addImageSpy = this.sandbox.spy(this.map, 'addImage');

    const defer = createDeferred();

    this.setProperties({
      name: 'marker',
      image: '/assets/marker.svg',
      onLoad: defer.resolve,
      onError: defer.reject,
    });

    await render(
      hbs`{{maplibre-gl-image this.name this.image map=this.map onLoad=this.onLoad onError=this.onError}}`
    );

    await defer.promise;

    assert.ok(addImageSpy.calledOnce, 'addImage called');
    assert.strictEqual(
      addImageSpy.firstCall.args[0],
      this.name,
      'adds as correct name'
    );
    assert.ok(addImageSpy.firstCall.args[1] instanceof Image, 'adds image');
  });

  test('it allows svgs to be added with custom width and height', async function (assert) {
    const addImageSpy = this.sandbox.spy(this.map, 'addImage');

    const defer = createDeferred();

    this.setProperties({
      name: 'marker-custom-width',
      image: '/assets/marker.svg',
      width: 64,
      height: 64,
      onLoad: defer.resolve,
      onError: defer.reject,
    });

    await render(
      hbs`{{maplibre-gl-image this.name this.image width=this.width height=this.height map=this.map onLoad=this.onLoad onError=this.onError}}`
    );

    await defer.promise;

    assert.ok(addImageSpy.calledOnce, 'addImage called');
    assert.strictEqual(
      addImageSpy.firstCall.args[0],
      this.name,
      'adds as correct name'
    );
    assert.ok(addImageSpy.firstCall.args[1] instanceof Image, 'adds image');
    assert.strictEqual(
      addImageSpy.firstCall.args[1].width,
      this.width,
      'image has width'
    );
    assert.strictEqual(
      addImageSpy.firstCall.args[1].height,
      this.height,
      'image has height'
    );
  });

  test('it sends out an error if provided a bad svg', async function (assert) {
    const defer = createDeferred();

    this.setProperties({
      name: 'bad-marker',
      image: '/assets/bad-marker.svg',
      onLoad: defer.resolve,
      onError: defer.reject,
    });

    try {
      await all([
        render(
          hbs`{{maplibre-gl-image this.name this.image map=this.map onLoad=this.onLoad onError=this.onError}}`
        ),
        defer.promise,
      ]);
      assert.ok(false, 'should have gotten error');
    } catch (err) {
      assert.strictEqual(
        err.message,
        'failed to load svg',
        'correct err message'
      );
      assert.ok(err.ev, 'should have original error event attached');
    }
  });
});
