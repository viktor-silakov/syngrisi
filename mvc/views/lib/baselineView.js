/* eslint-disable dot-notation */
/* global XMLHttpRequest fabric $ document window */

// eslint-disable-next-line no-unused-vars
class BaselineView {
    constructor(canvasId, image, params) {
        const thisClass = this;
        if (params.fileName) {
            fabric.Image.fromURL(`/snapshoots/${params.fileName}`, (oImg) => {
                window.backImage = oImg;
                thisClass['backImg'] = oImg;
                oImg.scaleToWidth(thisClass.canvas.width);
                thisClass.canvas.add(thisClass.backImg);

                thisClass.backImg.moveTo(0);

                thisClass.canvas.renderAll();
            });
        }
        if (params.canvas) {
            this.canvas = params.canvas;
        } else {
            this.canvas = new fabric.Canvas(canvasId, {
                preserveObjectStacking: true,
                uniScaleTransform: true,
            });
            if (params.height) {
                this.canvas.setHeight(params.height);
            } else {
                const ratio = params.weight / image.width;
                this.canvas.setHeight(image.height * ratio);
            }
            this.canvas.setWidth(params.weight);
        }
        this.image = image;
        const classThis = this;
        this.image.lockScalingX = true;
        this.image.lockScalingY = true;
        this.image.lockMovementX = true;
        this.image.lockMovementY = true;
        if (!params.noAddImage) {
            this.canvas.add(this.image);
        }

        this.image.sendToBack();
        this.image.scaleToWidth(this.canvas.width);

        this.canvas.on('object:selected', (o) => {
            if (o.target.name === 'ignore_rect') {
                $('#remove')
                    .show();
            } else {
                $('#remove')
                    .hide();
            }
        });

        this.canvas.on('selection:cleared', () => {
            $('#remove')
                .hide();
        });

        this.canvas.on('mouse:down', (e) => {
            if (!classThis.canvas.getActiveObject()) {
                $('.deleteBtn')
                    .remove();
            }
        });
    }

    destroy() {
        const classThis = this;
        this.allRects.forEach(
            (reg) => {
                classThis.canvas.remove(reg);
            }
        );
    }

    rect(params) {
        params.name = params.name ? params.name : 'default_rect';
        let lastLeft = null;
        let lastTop = null;
        let width = null;
        let height = null;
        if ((this.getLastRegion() !== undefined) && (this.getLastRegion().name === 'ignore_rect')) {
            lastLeft = this.getLastRegion().left || 50;
            lastTop = this.getLastRegion().top;
            width = this.getLastRegion()
                .getScaledWidth();
            height = this.getLastRegion()
                .getScaledHeight();
        }
        // if last elements fit in current viewport create new region near this region
        const top = (lastTop > document.documentElement.scrollTop && lastTop < document.documentElement.scrollTop + window.innerHeight)
            ? lastTop + 20
            : document.documentElement.scrollTop + 50;
        const left = (lastLeft < (this.canvas.width - 80)) ? lastLeft + 20 : lastLeft - 50;
        return new fabric.Rect({
            left: params.left || left,
            top: params.top || top,
            fill: params.fill || 'blue',
            width: params.width || width || 200,
            height: params.height || height || 100,
            strokeWidth: params.strokeWidth || 0,
            stroke: params.stroke || 'rgba(100,200,200,0.5)',
            opacity: 0.5,
            name: params.name,
            uniScaleTransform: true,
            noScaleCache: false,
        });
    }

    addIgnoreRegion(params) {
        const classThis = this;
        Object.assign(params, { fill: 'MediumVioletRed' });
        const r = this.rect(params);
        r.setControlsVisibility({
            bl: true,
            br: true,
            tl: true,
            tr: true,
            mt: true,
            mb: true,
            mtr: false,
        });

        r.on('selected', (e) => {
            classThis.addDeleteBtn(r);
        });

        r.on('modified', (e) => {
            classThis.addDeleteBtn(r);
        });

        r.on('scaling', (e) => {
            $('.deleteBtn')
                .remove();
        });
        r.on('moving', (e) => {
            $('.deleteBtn')
                .remove();
        });
        r.on('rotating', (e) => {
            $('.deleteBtn')
                .remove();
        });
        this.canvas.add(r);
        r.bringToFront();
        // become selected
        if (params.noSelect) {
            return;
        }
        this.canvas.setActiveObject(r);
    }

    addBoundingRegion(name) {
        const params = {
            name,
            fill: 'rgba(0,0,0,0)',
            stroke: 'green',
            strokeWidth: 3,
            top: 1,
            left: 1,
            width: this.image.getScaledWidth() - 10,
            height: this.image.getScaledHeight() - 10,
        };
        const r = this.rect(params);
        this.canvas.add(r);
        r.bringToFront();
    }

    getLastRegion() {
        return this.canvas.item(this.canvas.getObjects().length - 1);
    }

    resize(ratio) {
        const w = this.image.getScaledWidth();
        this.image.scaleToWidth(w * ratio);
        const classThis = this;
        this.allRects.forEach((reg) => {
            reg.setCoords();
            reg.width *= ratio;
            reg.height *= ratio;
            // reg.scale(ratio);
            reg.setCoords();
            classThis.canvas.renderAll();
            // console.log('ratio', ratio)
            console.log('New Scaled W, H', reg.getScaledWidth(), reg.getScaledHeight());
            console.log('New  W, H', reg.width, reg.height);

            reg.top *= ratio;
            reg.left *= ratio;
        });
        $('.deleteBtn')
            .remove();
        this.canvas.renderAll();
    }

    /**
     * 1. collect data about all rects
     * 2. convert the data to resemble.js format
     * 3. return json string
     */
    getRectData() {
        const rects = this.allRects;
        const data = [];
        const coef = parseFloat(this.coef);

        rects.forEach((reg) => {
            const right = reg.left + reg.getScaledWidth();
            const bottom = reg.top + reg.getScaledHeight();
            if (coef) {
                data.push({
                    name: reg.name,
                    top: reg.top * coef,
                    left: reg.left * coef,
                    bottom: bottom * coef,
                    right: right * coef,
                });
            }
        });
        return JSON.stringify(data);
    }

    get coef() {
        return this.image.height / this.image.getScaledHeight();
    }

    showNotification(msg, status = 'Success') {
        document.getElementById('notify-header').textContent = status;
        document.getElementById('notify-message').textContent = msg;
        document.getElementById('notify-rect')
            .setAttribute('fill', '#2ECC40');
        if (status === 'Error') {
            document.getElementById('notify-rect')
                .setAttribute('fill', '#FF4136');
        }
        $('#notify')
            .show();
        setTimeout(() => {
                $('#notify')
                    .hide();
            },
            4000);
    }

    sendIgnoreRegions(id, regionsData) {
        const xhr = new XMLHttpRequest();
        const params = `id=${id}&ignoreRegions=${JSON.stringify(regionsData)}`;
        xhr.open('PUT', `/snapshots/${id}`, true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        const classThis = this;
        // NEED TO ADD UPDATE BASELINE LOGIC TO .onload EVENT!!!
        xhr.onload = function () {
            if (xhr.status === 200) {
                console.log(`Successful send regions data, id: '${id}'  resp: '${xhr.responseText}'`);
                classThis.showNotification('Regions were saved');
            } else {
                console.error(`Cannot send regions data, status: '${xhr.status}',  resp: '${xhr.responseText}'`);
                classThis.showNotification('Cannot save regions', 'Error');
            }
        };
        xhr.send(params);
    }

    /**
     * @param {string} regions       JSON string that contain data about regions in resemble.js format
     * @returns {object}             region data in fabric.js format
     */
    convertRegionsDataFromServer(regions) {
        const data = [];
        const coef = parseFloat(this.coef);
        JSON.parse(regions)
            .forEach((reg) => {
                const width = reg.right - reg.left;
                const height = reg.bottom - reg.top;
                if (coef) {
                    data.push({
                        name: reg.name,
                        top: reg.top / coef,
                        left: reg.left / coef,
                        width: width / coef,
                        height: height / coef,
                    });
                }
            });
        return data;
    }

    get allRects() {
        return this.canvas.getObjects()
            .filter((r) => (r.name === 'ignore_rect') || (r.name === 'bound_rect'));
    }

    drawRegions(data) {
        // console.log({ data });
        if (!data || data === 'undefined') {
            return;
            // console.error('The regions data is empty')
        }
        const regs = this.convertRegionsDataFromServer(JSON.parse(data));
        // console.log('converted:', regs.length, regs);
        const classThis = this;
        regs.forEach((regParams) => {
            regParams['noSelect'] = true;
            classThis.addIgnoreRegion(regParams);
        });
    }

    getRegionsData(snapshootId) {
        return new Promise((resolve, reject) => {
            // console.log(`get snapshoot data id: ${snapshootId}`);
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `/snapshot/${snapshootId}/`, true);
            xhr.onload = function () {
                if (xhr.status === 200) {
                    // console.log(`Successful got regions data, id: '${snapshootId}'  resp: '${xhr.responseText}'`);
                    return resolve(JSON.parse(xhr.responseText));
                }
                console.error(`Cannot get regions data, status: '${xhr.status}',  resp: '${xhr.responseText}'`);
                return reject(xhr);
            };
            xhr.send('');
        });
    }

    async getSnapshotIgnoreRegionsDataAndDrawRegions(id) {
        const regionData = await this.getRegionsData(id);
        this.drawRegions(regionData.ignoreRegions);
    }

    addDeleteBtn(target) {
        const regionIndex = this.canvas.getObjects()
            .indexOf(target);
        $('.deleteBtn')
            .remove();
        const btnLeft = target.calcCoords().tr.x - 0;
        const btnTop = target.calcCoords().tr.y - 15;

        // eslint-disable-next-line max-len
        const deleteBtn = `<i name="delete-region" id="region-delete-icon-${regionIndex}" class="far fa-1x fa-window-close deleteBtn bg-transparent" style="color: red; background-color: white; position:absolute;top:${btnTop}px;left:${btnLeft}px;cursor:pointer; padding: 0px"></i>`;
        $('.canvas-container')
            .append(deleteBtn);
    }

    toggleDiff(diffId) {
        const thisClass = this;
        if (diffId && !thisClass['diffImg']) {
            fabric.Image.fromURL(`/snapshoots/${diffId}.png`, (diffImg) => {
                window.backImage = diffImg;
                thisClass['diffImg'] = diffImg;
                diffImg.scaleToWidth(thisClass.canvas.width);
                thisClass.canvas.add(thisClass.diffImg);

                thisClass.diffImg.bringToFront();
                thisClass.canvas.renderAll();
            });
        } else {
            thisClass.canvas.remove(thisClass['diffImg']);
            thisClass['diffImg'] = undefined;
        }
    }
}
